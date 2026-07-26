/**
 * Real Coordination Policies service — governs how a mission's coordinator
 * resolves conflicts and delegates.
 *
 * @module coordination/policy.impl
 */
import { generateId, nowIso } from '../shared/id.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { CoordinationPolicyRepository } from './repository.js';
import type { CoordinationPolicy } from './types.js';
import type { VotingStrategy } from '../consensus/types.js';

const DEFAULT_POLICY: Omit<CoordinationPolicy, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'missionId'> = {
  defaultVotingStrategy: 'majority',
  escalationThresholdScore: '0.50',
  maxDelegationDepth: 3,
  autoStartWorkflows: false,
};

export interface CoordinationPolicyInput {
  readonly defaultVotingStrategy?: VotingStrategy;
  readonly escalationThresholdScore?: string;
  readonly maxDelegationDepth?: number;
  readonly autoStartWorkflows?: boolean;
}

export interface CoordinationPolicyService {
  define(organizationId: OrganizationId, missionId: MissionId, input?: CoordinationPolicyInput): Promise<CoordinationPolicy>;
  /** Returns the mission's policy, or a deterministic default (not persisted) if none was defined. */
  resolve(organizationId: OrganizationId, missionId: MissionId): Promise<CoordinationPolicy>;
}

/** Creates a real {@link CoordinationPolicyService}. */
export function createCoordinationPolicyService(repository: CoordinationPolicyRepository): CoordinationPolicyService {
  return {
    async define(organizationId, missionId, input = {}) {
      const now = nowIso();
      const policy: CoordinationPolicy = {
        id: generateId('coordination-policy'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        missionId,
        ...DEFAULT_POLICY,
        ...input,
      };
      await repository.save(policy);
      return policy;
    },

    async resolve(organizationId, missionId) {
      const existing = await repository.findByMission(organizationId, missionId);
      if (existing) return existing;
      const now = nowIso();
      return {
        id: generateId('coordination-policy-default'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        missionId,
        ...DEFAULT_POLICY,
      };
    },
  };
}
