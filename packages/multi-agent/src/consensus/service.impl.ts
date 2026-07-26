/**
 * Real Consensus service — deterministic vote tallying per
 * {@link VotingStrategy}, and binding-agreement creation once reached.
 *
 * @module consensus/service.impl
 */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { CollaborationEventBus } from '../events/collaboration-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MissionId, NegotiationId, OrganizationId } from '../shared/identifiers.js';
import type { MissionWorkerRole } from '../shared/primitives.js';
import type { AgreementRepository, ConsensusResultRepository } from './repository.js';
import type { Agreement, ConsensusResult, VotingStrategy } from './types.js';

export interface Vote {
  readonly workerId: WorkerId;
  readonly role: MissionWorkerRole;
  readonly approve: boolean;
}

const ROLE_WEIGHT: Readonly<Record<MissionWorkerRole, number>> = {
  ceo_ai: 3,
  product_manager_ai: 2,
  marketing_ai: 1,
  sales_ai: 1,
  operations_ai: 1,
  finance_ai: 1,
  hr_ai: 1,
};

export interface TallyVotesInput {
  readonly organizationId: OrganizationId;
  readonly missionId: MissionId;
  readonly negotiationId?: NegotiationId;
  readonly strategy: VotingStrategy;
  readonly votes: readonly Vote[];
  readonly leaderWorkerId?: WorkerId;
}

/** Deterministically tallies `votes` under `strategy` and returns { reached, score }. */
export function tallyVotes(strategy: VotingStrategy, votes: readonly Vote[], leaderWorkerId?: WorkerId): { readonly reached: boolean; readonly score: string } {
  if (votes.length === 0) return { reached: false, score: '0.00' };

  switch (strategy) {
    case 'unanimous': {
      const reached = votes.every((vote) => vote.approve);
      return { reached, score: (votes.filter((vote) => vote.approve).length / votes.length).toFixed(2) };
    }
    case 'majority': {
      const approveCount = votes.filter((vote) => vote.approve).length;
      const score = approveCount / votes.length;
      return { reached: score > 0.5, score: score.toFixed(2) };
    }
    case 'weighted_by_role': {
      const totalWeight = votes.reduce((sum, vote) => sum + ROLE_WEIGHT[vote.role], 0);
      const approveWeight = votes.filter((vote) => vote.approve).reduce((sum, vote) => sum + ROLE_WEIGHT[vote.role], 0);
      const score = totalWeight > 0 ? approveWeight / totalWeight : 0;
      return { reached: score > 0.5, score: score.toFixed(2) };
    }
    case 'leader_veto': {
      const approveCount = votes.filter((vote) => vote.approve).length;
      const score = approveCount / votes.length;
      const leaderVote = votes.find((vote) => vote.workerId === leaderWorkerId);
      const vetoed = leaderVote !== undefined && !leaderVote.approve;
      return { reached: !vetoed && score > 0.5, score: score.toFixed(2) };
    }
    case 'decision_engine':
      // Defers to Decision Engine — not resolvable by a vote tally alone.
      // The caller (see conflict/resolver.impl.ts) escalates when this strategy is selected.
      return { reached: false, score: '0.00' };
    default:
      return { reached: false, score: '0.00' };
  }
}

export interface ConsensusService {
  tally(input: TallyVotesInput): Promise<ConsensusResult>;
  createAgreement(organizationId: OrganizationId, consensusResultId: string, missionId: MissionId, summary: string, signatoryWorkerIds: readonly WorkerId[]): Promise<Agreement>;
}

/** Creates a real {@link ConsensusService}. */
export function createConsensusService(
  resultRepository: ConsensusResultRepository,
  agreementRepository: AgreementRepository,
  eventBus?: CollaborationEventBus,
): ConsensusService {
  return {
    async tally(input) {
      const { reached, score } = tallyVotes(input.strategy, input.votes, input.leaderWorkerId);
      const now = nowIso();
      const result: ConsensusResult = {
        id: generateId('consensus-result'),
        organizationId: input.organizationId,
        createdAt: now,
        updatedAt: now,
        missionId: input.missionId,
        negotiationId: input.negotiationId,
        strategy: input.strategy,
        reached,
        agreementScore: score,
        dissentingWorkerIds: input.votes.filter((vote) => !vote.approve).map((vote) => vote.workerId),
        resolvedAt: now,
      };
      await resultRepository.save(result);
      eventBus?.publish('consensus.reached', { missionId: input.missionId, strategy: input.strategy, reached });
      return result;
    },

    async createAgreement(organizationId, consensusResultId, missionId, summary, signatoryWorkerIds) {
      const now = nowIso();
      const agreement: Agreement = {
        id: generateId('agreement'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        consensusResultId,
        missionId,
        summary,
        signatoryWorkerIds,
        status: 'accepted',
        effectiveAt: now,
      };
      await agreementRepository.save(agreement);
      return agreement;
    },
  };
}
