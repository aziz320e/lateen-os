/**
 * Real Authorization service — RBAC (with role inheritance), ABAC,
 * policy-based access, permission checks, and tenant isolation.
 *
 * @module authorization/service.impl
 */
import type { AuditService } from '../audit/index.js';
import type { SecurityEventBus } from '../events/security-event-bus.js';
import { PolicyNotFoundError, RoleNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, PolicyId, RoleId } from '../shared/identifiers.js';
import type { PolicyRepository, RoleAssignmentRepository, RoleRepository } from './repository.js';
import type { AuthorizeRequest, AuthorizeResult, AttributeOperator, Policy, PolicyRule, Role } from './types.js';

export interface CreateRoleInput {
  readonly name: string;
  readonly permissions?: readonly string[];
  readonly parentRoleId?: RoleId;
}

export interface CreatePolicyInput {
  readonly name: string;
  readonly policyType: Policy['policyType'];
  readonly effect: Policy['effect'];
  readonly rules: readonly PolicyRule[];
}

export interface UpdatePolicyInput {
  readonly name?: string;
  readonly rules?: readonly PolicyRule[];
}

export interface AuthorizationService {
  createRole(organizationId: OrganizationId, input: CreateRoleInput): Promise<Role>;
  archiveRole(organizationId: OrganizationId, roleId: RoleId): Promise<Role>;
  getRole(organizationId: OrganizationId, roleId: RoleId): Promise<Role | null>;
  assignRole(organizationId: OrganizationId, identityId: string, roleId: RoleId): Promise<void>;
  unassignRole(organizationId: OrganizationId, identityId: string, roleId: RoleId): Promise<void>;
  /** Direct role assignments only — does not walk inheritance. */
  getAssignedRoles(organizationId: OrganizationId, identityId: string): Promise<readonly RoleId[]>;
  /** Every permission granted by every assigned role, walking parent-role inheritance (cycle-safe), deduplicated and sorted. */
  getEffectivePermissions(organizationId: OrganizationId, identityId: string): Promise<readonly string[]>;
  hasPermission(organizationId: OrganizationId, identityId: string, permission: string): Promise<boolean>;
  createPolicy(organizationId: OrganizationId, input: CreatePolicyInput): Promise<Policy>;
  updatePolicy(organizationId: OrganizationId, policyId: PolicyId, patch: UpdatePolicyInput): Promise<Policy>;
  archivePolicy(organizationId: OrganizationId, policyId: PolicyId): Promise<Policy>;
  getPolicy(organizationId: OrganizationId, policyId: PolicyId): Promise<Policy | null>;
  /** The main authorization entry point — tenant isolation, then RBAC, then policy overrides. */
  authorize(organizationId: OrganizationId, request: AuthorizeRequest): Promise<AuthorizeResult>;
}

function matchesAttribute(actual: string | undefined, operator: AttributeOperator, expected: string | readonly string[]): boolean {
  if (operator === 'eq') return actual === expected;
  if (operator === 'neq') return actual !== expected;
  return Array.isArray(expected) ? expected.includes(actual ?? '') : actual === expected;
}

/** Creates a real {@link AuthorizationService} over the Role, Policy, and Role Assignment repositories. */
export function createAuthorizationService(
  roleRepository: RoleRepository,
  policyRepository: PolicyRepository,
  assignmentRepository: RoleAssignmentRepository,
  audit?: Pick<AuditService, 'record'>,
  eventBus?: SecurityEventBus,
  now: () => string = nowIso,
): AuthorizationService {
  async function requireRole(organizationId: OrganizationId, roleId: RoleId): Promise<Role> {
    const role = await roleRepository.findById(organizationId, roleId);
    if (!role) throw new RoleNotFoundError(roleId);
    return role;
  }

  async function requirePolicy(organizationId: OrganizationId, policyId: PolicyId): Promise<Policy> {
    const policy = await policyRepository.findById(organizationId, policyId);
    if (!policy) throw new PolicyNotFoundError(policyId);
    return policy;
  }

  async function getEffectivePermissions(organizationId: OrganizationId, identityId: string): Promise<readonly string[]> {
    const assignedRoleIds = await assignmentRepository.findRoleIds(organizationId, identityId);
    const permissions = new Set<string>();
    const visited = new Set<RoleId>();

    async function walk(roleId: RoleId): Promise<void> {
      if (visited.has(roleId)) return;
      visited.add(roleId);
      const role = await roleRepository.findById(organizationId, roleId);
      if (!role) return;
      for (const permission of role.permissions) permissions.add(permission);
      if (role.parentRoleId) await walk(role.parentRoleId);
    }

    for (const roleId of assignedRoleIds) await walk(roleId);
    return [...permissions].sort();
  }

  async function policyMatches(organizationId: OrganizationId, policy: Policy, identityId: string, attributes?: Readonly<Record<string, string>>): Promise<boolean> {
    if (policy.rules.length === 0) return false;
    const [assignedRoleIds, effectivePermissions] = await Promise.all([
      assignmentRepository.findRoleIds(organizationId, identityId),
      getEffectivePermissions(organizationId, identityId),
    ]);

    return policy.rules.every((rule) => {
      if (rule.type === 'role') return assignedRoleIds.includes(rule.roleId);
      if (rule.type === 'permission') return effectivePermissions.includes(rule.permission);
      return matchesAttribute(attributes?.[rule.attribute], rule.operator, rule.value);
    });
  }

  return {
    async createRole(organizationId, input) {
      const timestamp = now();
      const role: Role = {
        id: generateId('role'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        permissions: input.permissions ?? [],
        parentRoleId: input.parentRoleId,
        status: 'active',
      };
      await roleRepository.save(role);
      return role;
    },

    async archiveRole(organizationId, roleId) {
      const role = await requireRole(organizationId, roleId);
      const updated: Role = { ...role, status: 'archived', updatedAt: now() };
      await roleRepository.save(updated);
      return updated;
    },

    async getRole(organizationId, roleId) {
      return roleRepository.findById(organizationId, roleId);
    },

    async assignRole(organizationId, identityId, roleId) {
      await assignmentRepository.assign(organizationId, identityId, roleId);
    },

    async unassignRole(organizationId, identityId, roleId) {
      await assignmentRepository.unassign(organizationId, identityId, roleId);
    },

    async getAssignedRoles(organizationId, identityId) {
      return assignmentRepository.findRoleIds(organizationId, identityId);
    },

    getEffectivePermissions: (organizationId, identityId) => getEffectivePermissions(organizationId, identityId),

    async hasPermission(organizationId, identityId, permission) {
      const permissions = await getEffectivePermissions(organizationId, identityId);
      return permissions.includes(permission);
    },

    async createPolicy(organizationId, input) {
      const timestamp = now();
      const policy: Policy = {
        id: generateId('policy'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        policyType: input.policyType,
        effect: input.effect,
        rules: input.rules,
        status: 'active',
      };
      await policyRepository.save(policy);
      eventBus?.publish('policy.updated', { policyId: policy.id, organizationId });
      await audit?.record(organizationId, { category: 'policy', action: 'create_policy', outcome: 'success', details: { policyId: policy.id } });
      return policy;
    },

    async updatePolicy(organizationId, policyId, patch) {
      const policy = await requirePolicy(organizationId, policyId);
      const updated: Policy = {
        ...policy,
        name: patch.name ?? policy.name,
        rules: patch.rules ?? policy.rules,
        updatedAt: now(),
      };
      await policyRepository.save(updated);
      eventBus?.publish('policy.updated', { policyId, organizationId });
      await audit?.record(organizationId, { category: 'policy', action: 'update_policy', outcome: 'success', details: { policyId } });
      return updated;
    },

    async archivePolicy(organizationId, policyId) {
      const policy = await requirePolicy(organizationId, policyId);
      const updated: Policy = { ...policy, status: 'archived', updatedAt: now() };
      await policyRepository.save(updated);
      eventBus?.publish('policy.updated', { policyId, organizationId });
      await audit?.record(organizationId, { category: 'policy', action: 'archive_policy', outcome: 'success', details: { policyId } });
      return updated;
    },

    async getPolicy(organizationId, policyId) {
      return policyRepository.findById(organizationId, policyId);
    },

    async authorize(organizationId, request) {
      async function deny(reason: string): Promise<AuthorizeResult> {
        eventBus?.publish('authorization.denied', { organizationId, identityId: request.identityId, permission: request.permission, reason });
        await audit?.record(organizationId, {
          category: 'authorization',
          action: 'authorize',
          actorId: request.identityId,
          outcome: 'failure',
          details: { permission: request.permission, reason },
        });
        return { allowed: false, reason };
      }

      if (request.resourceOrganizationId !== organizationId) {
        return deny('tenant_isolation');
      }

      const activePolicies = await policyRepository.findByStatus(organizationId, 'active');
      const denyPolicies = activePolicies.filter((policy) => policy.effect === 'deny');
      for (const policy of denyPolicies) {
        if (await policyMatches(organizationId, policy, request.identityId, request.attributes)) {
          return deny('policy_denied');
        }
      }

      const rbacAllowed = await getEffectivePermissions(organizationId, request.identityId).then((permissions) => permissions.includes(request.permission));
      if (rbacAllowed) {
        await audit?.record(organizationId, { category: 'authorization', action: 'authorize', actorId: request.identityId, outcome: 'success', details: { permission: request.permission } });
        return { allowed: true };
      }

      const allowPolicies = activePolicies.filter((policy) => policy.effect === 'allow');
      for (const policy of allowPolicies) {
        if (await policyMatches(organizationId, policy, request.identityId, request.attributes)) {
          await audit?.record(organizationId, { category: 'authorization', action: 'authorize', actorId: request.identityId, outcome: 'success', details: { permission: request.permission, policyId: policy.id } });
          return { allowed: true };
        }
      }

      return deny('no_permission');
    },
  };
}
