/**
 * Real Policy Engine — business, approval, communication, and sales
 * policies (plus the pre-existing compliance/financial/operational/
 * security/hr types), with a guarded lifecycle and approval tracking.
 * Every mutation publishes `policy.updated` — the only Policy event
 * required by the runtime event bus.
 *
 * @module policy/engine.impl
 */
import type { BusinessDnaEventBus } from '../events/business-dna-event-bus.js';
import { InvalidPolicyTransitionError, PolicyNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { DepartmentId, EmployeeId, OrganizationId, PolicyId } from '../shared/identifiers.js';
import type { BusinessCode, ISODate } from '../shared/primitives.js';
import type { PolicyRepository } from './repository.js';
import type { Policy, PolicySeverity, PolicyStatus, PolicyType } from './types.js';

const POLICY_TRANSITIONS: Readonly<Record<PolicyStatus, readonly PolicyStatus[]>> = {
  draft: ['active', 'archived'],
  active: ['suspended', 'archived'],
  suspended: ['active', 'archived'],
  archived: [],
};

export function canTransitionPolicy(from: PolicyStatus, to: PolicyStatus): boolean {
  return POLICY_TRANSITIONS[from].includes(to);
}

export interface CreatePolicyInput {
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly type: PolicyType;
  readonly severity?: PolicySeverity;
  readonly entityType?: string;
  readonly effectiveFrom?: ISODate;
  readonly effectiveUntil?: ISODate;
  readonly ownerDepartmentId?: DepartmentId;
}

export interface PolicyEngine {
  create(organizationId: OrganizationId, input: CreatePolicyInput): Promise<Policy>;
  approve(organizationId: OrganizationId, policyId: PolicyId, approvedById: EmployeeId): Promise<Policy>;
  activate(organizationId: OrganizationId, policyId: PolicyId): Promise<Policy>;
  suspend(organizationId: OrganizationId, policyId: PolicyId): Promise<Policy>;
  archive(organizationId: OrganizationId, policyId: PolicyId): Promise<Policy>;
  get(organizationId: OrganizationId, policyId: PolicyId): Promise<Policy | null>;
  findByType(organizationId: OrganizationId, type: PolicyType): Promise<readonly Policy[]>;
}

/** Creates a real {@link PolicyEngine} backed by a {@link PolicyRepository}. */
export function createPolicyEngine(repository: PolicyRepository, eventBus?: BusinessDnaEventBus, now: () => string = nowIso): PolicyEngine {
  async function requirePolicy(organizationId: OrganizationId, policyId: PolicyId): Promise<Policy> {
    const policy = await repository.findById(organizationId, policyId);
    if (!policy) throw new PolicyNotFoundError(policyId);
    return policy;
  }

  async function transition(organizationId: OrganizationId, policyId: PolicyId, to: PolicyStatus): Promise<Policy> {
    const policy = await requirePolicy(organizationId, policyId);
    if (!canTransitionPolicy(policy.status, to)) {
      throw new InvalidPolicyTransitionError(policyId, policy.status, to);
    }
    const updated: Policy = { ...policy, status: to, updatedAt: now() };
    await repository.save(updated);
    eventBus?.publish('policy.updated', { policyId, organizationId });
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const policy: Policy = {
        id: generateId('policy'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        code: input.code,
        name: input.name,
        description: input.description,
        type: input.type,
        status: 'draft',
        severity: input.severity,
        entityType: input.entityType,
        effectiveFrom: input.effectiveFrom,
        effectiveUntil: input.effectiveUntil,
        ownerDepartmentId: input.ownerDepartmentId,
      };
      await repository.save(policy);
      eventBus?.publish('policy.updated', { policyId: policy.id, organizationId });
      return policy;
    },

    async approve(organizationId, policyId, approvedById) {
      const policy = await requirePolicy(organizationId, policyId);
      const updated: Policy = { ...policy, approvedById, approvedAt: now(), updatedAt: now() };
      await repository.save(updated);
      eventBus?.publish('policy.updated', { policyId, organizationId });
      return updated;
    },

    async activate(organizationId, policyId) {
      return transition(organizationId, policyId, 'active');
    },

    async suspend(organizationId, policyId) {
      return transition(organizationId, policyId, 'suspended');
    },

    async archive(organizationId, policyId) {
      return transition(organizationId, policyId, 'archived');
    },

    async get(organizationId, policyId) {
      return repository.findById(organizationId, policyId);
    },

    async findByType(organizationId, type) {
      return repository.findByType(organizationId, type);
    },
  };
}
