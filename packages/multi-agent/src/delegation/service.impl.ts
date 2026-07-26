/**
 * Real Delegation service — requests, responses, and policies, with real
 * chain-depth enforcement (traces how many prior accepted delegations
 * chain into the requesting worker).
 *
 * @module delegation/service.impl
 */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { CollaborationEventBus } from '../events/collaboration-event-bus.js';
import { DelegationDepthExceededError, DelegationPolicyViolationError, NotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { MissionWorkerRole } from '../shared/primitives.js';
import type { DelegationPolicyRepository, DelegationRequestRepository } from './repository.js';
import type {
  CollaborationDelegationId,
  DelegationPolicy,
  DelegationPolicyId,
  DelegationRequest,
} from './types.js';

const ACTIVE_STATUSES = new Set(['accepted', 'in_progress', 'completed']);

function computeDepth(requests: readonly DelegationRequest[], workerId: WorkerId, seen: ReadonlySet<WorkerId> = new Set()): number {
  if (seen.has(workerId)) return 0; // guards against a malformed cycle rather than looping forever
  const incoming = requests.filter((request) => request.targetWorkerId === workerId && ACTIVE_STATUSES.has(request.status));
  if (incoming.length === 0) return 0;
  const nextSeen = new Set(seen).add(workerId);
  return 1 + Math.max(...incoming.map((request) => computeDepth(requests, request.sourceWorkerId, nextSeen)));
}

export interface RequestDelegationInput {
  readonly organizationId: OrganizationId;
  readonly missionId: MissionId;
  readonly sourceWorkerId: WorkerId;
  readonly targetWorkerId: WorkerId;
  readonly objective: string;
  readonly rationale: string;
  readonly policyId?: DelegationPolicyId;
}

export interface CreateDelegationPolicyInput {
  readonly organizationId: OrganizationId;
  readonly missionId: MissionId;
  readonly name: string;
  readonly sourceRole: MissionWorkerRole;
  readonly targetRoles: readonly MissionWorkerRole[];
  readonly maxDepth: number;
  readonly requiresLeaderApproval: boolean;
}

export interface DelegationService {
  request(input: RequestDelegationInput): Promise<DelegationRequest>;
  respond(organizationId: OrganizationId, delegationId: CollaborationDelegationId, accepted: boolean, responderWorkerId: WorkerId, comment?: string): Promise<DelegationRequest>;
  createPolicy(input: CreateDelegationPolicyInput): Promise<DelegationPolicy>;
  listForMission(organizationId: OrganizationId, missionId: MissionId): Promise<readonly DelegationRequest[]>;
  depthOf(organizationId: OrganizationId, missionId: MissionId, workerId: WorkerId): Promise<number>;
}

/** Creates a real {@link DelegationService}. */
export function createDelegationService(
  requestRepository: DelegationRequestRepository,
  policyRepository: DelegationPolicyRepository,
  eventBus?: CollaborationEventBus,
): DelegationService {
  return {
    async request(input) {
      const existing = await requestRepository.findByMission(input.organizationId, input.missionId);

      if (input.policyId) {
        const policy = await policyRepository.findById(input.organizationId, input.policyId);
        if (!policy) throw new NotFoundError('DelegationPolicy', input.policyId);
        if (!policy.active) throw new DelegationPolicyViolationError(`Delegation policy "${input.policyId}" is not active`);
        const depth = computeDepth(existing, input.sourceWorkerId);
        if (depth + 1 > policy.maxDepth) {
          throw new DelegationDepthExceededError(input.missionId, policy.maxDepth);
        }
      }

      const now = nowIso();
      const request: DelegationRequest = {
        id: generateId('delegation-request'),
        organizationId: input.organizationId,
        createdAt: now,
        updatedAt: now,
        missionId: input.missionId,
        policyId: input.policyId,
        sourceWorkerId: input.sourceWorkerId,
        targetWorkerId: input.targetWorkerId,
        objective: input.objective,
        rationale: input.rationale,
        status: 'requested',
        requestedAt: now,
      };
      await requestRepository.save(request);
      eventBus?.publish('delegation.requested', { delegationId: request.id, sourceWorkerId: input.sourceWorkerId, targetWorkerId: input.targetWorkerId });
      return request;
    },

    async respond(organizationId, delegationId, accepted, responderWorkerId, comment) {
      const request = await requestRepository.findById(organizationId, delegationId);
      if (!request) throw new NotFoundError('DelegationRequest', delegationId);
      const now = nowIso();
      const updated: DelegationRequest = {
        ...request,
        status: accepted ? 'accepted' : 'rejected',
        respondedBy: responderWorkerId,
        responseComment: comment,
        respondedAt: now,
        updatedAt: now,
      };
      await requestRepository.save(updated);
      eventBus?.publish('delegation.responded', { delegationId, accepted });
      return updated;
    },

    async createPolicy(input) {
      const now = nowIso();
      const policy: DelegationPolicy = {
        id: generateId('delegation-policy'),
        organizationId: input.organizationId,
        createdAt: now,
        updatedAt: now,
        missionId: input.missionId,
        name: input.name,
        sourceRole: input.sourceRole,
        targetRoles: input.targetRoles,
        maxDepth: input.maxDepth,
        requiresLeaderApproval: input.requiresLeaderApproval,
        active: true,
      };
      await policyRepository.save(policy);
      return policy;
    },

    async listForMission(organizationId, missionId) {
      return requestRepository.findByMission(organizationId, missionId);
    },

    async depthOf(organizationId, missionId, workerId) {
      const requests = await requestRepository.findByMission(organizationId, missionId);
      return computeDepth(requests, workerId);
    },
  };
}
