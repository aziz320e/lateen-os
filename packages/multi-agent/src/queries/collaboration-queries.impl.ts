/**
 * Real {@link CollaborationQueries} implementation — a CQRS read layer
 * composed over the repository ports.
 *
 * @module queries/collaboration-queries.impl
 */
import type { AgentRegistrationRepository } from '../agent/repository.js';
import type { ConflictRepository } from '../conflict/repository.js';
import type { ConsensusResultRepository } from '../consensus/repository.js';
import type { CoordinationPlanRepository, CoordinationStepRepository } from '../coordination/repository.js';
import type { MissionRepository } from '../mission/repository.js';
import type { NegotiationRepository } from '../negotiation/repository.js';
import type { ReviewRequestRepository } from '../review/repository.js';
import type { AgentSessionRepository } from '../session/repository.js';
import type { MissionTeamRepository } from '../team/repository.js';
import type { SharedWorkingMemoryRepository } from '../working-memory/repository.js';
import type { CollaborationQueries } from './collaboration-queries.js';
import type {
  FindActiveSessionsQuery,
  FindActiveSessionsResult,
  FindAgentsQuery,
  FindAgentsResult,
  FindConflictsQuery,
  FindConflictsResult,
  FindConsensusQuery,
  FindConsensusQueryResult,
  FindCoordinationPlanQuery,
  FindCoordinationPlanResult,
  FindMissionQuery,
  FindMissionResult,
  FindOpenNegotiationsQuery,
  FindOpenNegotiationsResult,
  FindPendingReviewsQuery,
  FindPendingReviewsResult,
  FindTeamsQuery,
  FindTeamsResult,
  FindWorkingMemoryQuery,
  FindWorkingMemoryResult,
} from './types.js';

export interface CollaborationQueriesDeps {
  readonly missionRepository: MissionRepository;
  readonly teamRepository: MissionTeamRepository;
  readonly negotiationRepository: NegotiationRepository;
  readonly reviewRequestRepository: ReviewRequestRepository;
  readonly consensusResultRepository: ConsensusResultRepository;
  readonly agentRegistrationRepository: AgentRegistrationRepository;
  readonly conflictRepository: ConflictRepository;
  readonly workingMemoryRepository: SharedWorkingMemoryRepository;
  readonly sessionRepository: AgentSessionRepository;
  readonly coordinationPlanRepository: CoordinationPlanRepository;
  readonly coordinationStepRepository: CoordinationStepRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

/** Creates a real {@link CollaborationQueries} read port over the given repositories. */
export function createCollaborationQueries(deps: CollaborationQueriesDeps): CollaborationQueries {
  return {
    async findMission(query: FindMissionQuery): Promise<FindMissionResult> {
      let missions;
      if (query.missionId) {
        const mission = await deps.missionRepository.findById(query.organizationId, query.missionId);
        missions = mission ? [mission] : [];
      } else if (query.code) {
        const mission = await deps.missionRepository.findByCode(query.organizationId, query.code);
        missions = mission ? [mission] : [];
      } else if (query.status) {
        missions = await deps.missionRepository.findByStatus(query.organizationId, query.status);
      } else {
        missions = await deps.missionRepository.findAll(query.organizationId);
      }
      return { missions: paginate(missions, query.offset, query.limit), total: missions.length };
    },

    async findTeams(query: FindTeamsQuery): Promise<FindTeamsResult> {
      if (query.teamId) {
        const team = await deps.teamRepository.findById(query.organizationId, query.teamId);
        const teams = team ? [team] : [];
        return { teams, total: teams.length };
      }
      if (query.missionId) {
        const team = await deps.teamRepository.findByMission(query.organizationId, query.missionId);
        const teams = team ? [team] : [];
        return { teams, total: teams.length };
      }
      return { teams: [], total: 0 };
    },

    async findOpenNegotiations(query: FindOpenNegotiationsQuery): Promise<FindOpenNegotiationsResult> {
      const scoped = query.missionId
        ? await deps.negotiationRepository.findByMission(query.organizationId, query.missionId)
        : [];
      const filtered = query.status ? scoped.filter((negotiation) => negotiation.status === query.status) : scoped;
      return { negotiations: paginate(filtered, query.offset, query.limit), total: filtered.length };
    },

    async findPendingReviews(query: FindPendingReviewsQuery): Promise<FindPendingReviewsResult> {
      const scoped = query.missionId ? await deps.reviewRequestRepository.findByMission(query.organizationId, query.missionId) : [];
      const filtered = scoped
        .filter((review) => (query.status ? review.status === query.status : true))
        .filter((review) => (query.reviewerWorkerId ? review.reviewerWorkerIds.includes(query.reviewerWorkerId) : true));
      return { reviews: paginate(filtered, query.offset, query.limit), total: filtered.length };
    },

    async findConsensus(query: FindConsensusQuery): Promise<FindConsensusQueryResult> {
      const scoped = query.missionId ? await deps.consensusResultRepository.findByMission(query.organizationId, query.missionId) : [];
      const filtered = scoped
        .filter((result) => (query.consensusResultId ? result.id === query.consensusResultId : true))
        .filter((result) => (query.negotiationId ? result.negotiationId === query.negotiationId : true))
        .filter((result) => (query.reached !== undefined ? result.reached === query.reached : true));
      return { results: paginate(filtered, query.offset, query.limit), total: filtered.length };
    },

    async findAgents(query: FindAgentsQuery): Promise<FindAgentsResult> {
      const all = await deps.agentRegistrationRepository.findAll(query.organizationId);
      const filtered = all
        .filter((registration) => (query.role ? registration.descriptor.role === query.role : true))
        .filter((registration) => (query.availability ? registration.availability === query.availability : true));
      return { agents: paginate(filtered, query.offset, query.limit), total: filtered.length };
    },

    async findConflicts(query: FindConflictsQuery): Promise<FindConflictsResult> {
      const scoped = query.missionId ? await deps.conflictRepository.findByMission(query.organizationId, query.missionId) : [];
      const filtered = query.status ? scoped.filter((conflict) => conflict.status === query.status) : scoped;
      return { conflicts: paginate(filtered, query.offset, query.limit), total: filtered.length };
    },

    async findWorkingMemory(query: FindWorkingMemoryQuery): Promise<FindWorkingMemoryResult> {
      const all = await deps.workingMemoryRepository.findByMission(query.organizationId, query.missionId);
      const filtered = query.key ? all.filter((entry) => entry.key === query.key) : all;
      return { entries: paginate(filtered, query.offset, query.limit), total: filtered.length };
    },

    async findActiveSessions(query: FindActiveSessionsQuery): Promise<FindActiveSessionsResult> {
      const all = await deps.sessionRepository.findByMission(query.organizationId, query.missionId);
      const active = all.filter((session) => session.status === 'active');
      return { sessions: paginate(active, query.offset, query.limit), total: active.length };
    },

    async findCoordinationPlan(query: FindCoordinationPlanQuery): Promise<FindCoordinationPlanResult> {
      const plan = await deps.coordinationPlanRepository.findByMission(query.organizationId, query.missionId);
      if (!plan) return { plan: null, steps: [] };
      const steps = await deps.coordinationStepRepository.findByPlan(query.organizationId, plan.id);
      return { plan, steps: [...steps].sort((a, b) => a.sequence - b.sequence) };
    },
  };
}
