/**
 * Real Governance Policy Engine — create/update/activate/deactivate/
 * archive/restore lifecycle plus full version history for the seven
 * governance policy domains (security, workflow, ai, communication,
 * business, approval, runtime).
 *
 * @module policy/engine.impl
 */
import type { GovernanceEventBus } from '../events/governance-event-bus.js';
import { GovernancePolicyNotFoundError, InvalidPolicyTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { GovernancePolicyId, OrganizationId } from '../shared/identifiers.js';
import type { GovernancePolicyRepository, GovernancePolicyVersionRepository } from './repository.js';
import type { GovernancePolicy, GovernancePolicyStatus, GovernancePolicyType, GovernancePolicyVersion } from './types.js';

const POLICY_TRANSITIONS: Readonly<Record<GovernancePolicyStatus, readonly GovernancePolicyStatus[]>> = {
  draft: ['active', 'archived'],
  active: ['inactive', 'archived'],
  inactive: ['active', 'archived'],
  // Archived is a dead end for ordinary transitions — restore() is a distinct
  // operation (below) that returns a policy to its pre-archive status without
  // going through this table, so activate()/deactivate() cannot be used to
  // bypass restore() on an archived policy.
  archived: [],
};

/** Whether a governance policy may transition from one status to another via the ordinary lifecycle (not `restore()`). */
export function canTransitionPolicy(from: GovernancePolicyStatus, to: GovernancePolicyStatus): boolean {
  return POLICY_TRANSITIONS[from].includes(to);
}

export interface CreatePolicyInput {
  readonly name: string;
  readonly policyType: GovernancePolicyType;
  readonly description?: string;
  readonly rules?: Readonly<Record<string, unknown>>;
}

export interface UpdatePolicyInput {
  readonly name?: string;
  readonly description?: string;
  readonly rules?: Readonly<Record<string, unknown>>;
}

export interface GovernancePolicyEngine {
  create(organizationId: OrganizationId, input: CreatePolicyInput): Promise<GovernancePolicy>;
  update(organizationId: OrganizationId, policyId: GovernancePolicyId, input: UpdatePolicyInput): Promise<GovernancePolicy>;
  activate(organizationId: OrganizationId, policyId: GovernancePolicyId): Promise<GovernancePolicy>;
  deactivate(organizationId: OrganizationId, policyId: GovernancePolicyId): Promise<GovernancePolicy>;
  archive(organizationId: OrganizationId, policyId: GovernancePolicyId): Promise<GovernancePolicy>;
  restore(organizationId: OrganizationId, policyId: GovernancePolicyId): Promise<GovernancePolicy>;
  get(organizationId: OrganizationId, policyId: GovernancePolicyId): Promise<GovernancePolicy | null>;
  getVersionHistory(organizationId: OrganizationId, policyId: GovernancePolicyId): Promise<readonly GovernancePolicyVersion[]>;
}

/** Creates a real {@link GovernancePolicyEngine} backed by the policy and policy-version repositories. */
export function createGovernancePolicyEngine(
  repository: GovernancePolicyRepository,
  versionRepository: GovernancePolicyVersionRepository,
  eventBus?: GovernanceEventBus,
  now: () => string = nowIso,
): GovernancePolicyEngine {
  async function requirePolicy(organizationId: OrganizationId, policyId: GovernancePolicyId): Promise<GovernancePolicy> {
    const policy = await repository.findById(organizationId, policyId);
    if (!policy) throw new GovernancePolicyNotFoundError(policyId);
    return policy;
  }

  async function snapshot(policy: GovernancePolicy): Promise<void> {
    const version: GovernancePolicyVersion = {
      id: generateId('policy-version'),
      organizationId: policy.organizationId,
      createdAt: policy.updatedAt,
      updatedAt: policy.updatedAt,
      policyId: policy.id,
      version: policy.currentVersion,
      name: policy.name,
      description: policy.description,
      rules: policy.rules,
      status: policy.status,
    };
    await versionRepository.save(version);
  }

  async function transition(organizationId: OrganizationId, policyId: GovernancePolicyId, to: GovernancePolicyStatus): Promise<GovernancePolicy> {
    const policy = await requirePolicy(organizationId, policyId);
    if (!canTransitionPolicy(policy.status, to)) {
      throw new InvalidPolicyTransitionError(policyId, policy.status, to);
    }
    const updated: GovernancePolicy = {
      ...policy,
      status: to,
      statusBeforeArchive: to === 'archived' ? policy.status : policy.statusBeforeArchive,
      currentVersion: policy.currentVersion + 1,
      updatedAt: now(),
    };
    await repository.save(updated);
    await snapshot(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const policy: GovernancePolicy = {
        id: generateId('governance-policy'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        policyType: input.policyType,
        name: input.name,
        description: input.description,
        rules: input.rules,
        status: 'draft',
        currentVersion: 1,
      };
      await repository.save(policy);
      await snapshot(policy);
      eventBus?.publish('policy.created', { organizationId, policyId: policy.id, policyType: policy.policyType });
      return policy;
    },

    async update(organizationId, policyId, input) {
      const policy = await requirePolicy(organizationId, policyId);
      if (policy.status === 'archived') {
        throw new InvalidPolicyTransitionError(policyId, policy.status, policy.status);
      }
      const updated: GovernancePolicy = {
        ...policy,
        name: input.name ?? policy.name,
        description: input.description ?? policy.description,
        rules: input.rules ?? policy.rules,
        currentVersion: policy.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      await snapshot(updated);
      eventBus?.publish('policy.updated', { organizationId, policyId });
      return updated;
    },

    async activate(organizationId, policyId) {
      const updated = await transition(organizationId, policyId, 'active');
      eventBus?.publish('policy.activated', { organizationId, policyId });
      return updated;
    },

    async deactivate(organizationId, policyId) {
      const updated = await transition(organizationId, policyId, 'inactive');
      eventBus?.publish('policy.deactivated', { organizationId, policyId });
      return updated;
    },

    async archive(organizationId, policyId) {
      return transition(organizationId, policyId, 'archived');
    },

    async restore(organizationId, policyId) {
      const policy = await requirePolicy(organizationId, policyId);
      if (policy.status !== 'archived') {
        throw new InvalidPolicyTransitionError(policyId, policy.status, policy.statusBeforeArchive ?? 'draft');
      }
      const to = policy.statusBeforeArchive ?? 'draft';
      const updated: GovernancePolicy = { ...policy, status: to, currentVersion: policy.currentVersion + 1, updatedAt: now() };
      await repository.save(updated);
      await snapshot(updated);
      return updated;
    },

    async get(organizationId, policyId) {
      return repository.findById(organizationId, policyId);
    },

    async getVersionHistory(organizationId, policyId) {
      return versionRepository.findByPolicyId(organizationId, policyId);
    },
  };
}
