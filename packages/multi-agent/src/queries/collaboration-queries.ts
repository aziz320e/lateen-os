/** @module queries/collaboration-queries */
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

/** Read-side query port for multi-agent collaboration discovery and inspection. */
export interface CollaborationQueries {
  findMission(query: FindMissionQuery): Promise<FindMissionResult>;

  findTeams(query: FindTeamsQuery): Promise<FindTeamsResult>;

  findOpenNegotiations(query: FindOpenNegotiationsQuery): Promise<FindOpenNegotiationsResult>;

  findPendingReviews(query: FindPendingReviewsQuery): Promise<FindPendingReviewsResult>;

  findConsensus(query: FindConsensusQuery): Promise<FindConsensusQueryResult>;

  findAgents(query: FindAgentsQuery): Promise<FindAgentsResult>;

  findConflicts(query: FindConflictsQuery): Promise<FindConflictsResult>;

  findWorkingMemory(query: FindWorkingMemoryQuery): Promise<FindWorkingMemoryResult>;

  findActiveSessions(query: FindActiveSessionsQuery): Promise<FindActiveSessionsResult>;

  findCoordinationPlan(query: FindCoordinationPlanQuery): Promise<FindCoordinationPlanResult>;
}
