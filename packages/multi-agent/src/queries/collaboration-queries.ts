/** @module queries/collaboration-queries */
import type {
  FindConsensusQuery,
  FindConsensusQueryResult,
  FindMissionQuery,
  FindMissionResult,
  FindOpenNegotiationsQuery,
  FindOpenNegotiationsResult,
  FindPendingReviewsQuery,
  FindPendingReviewsResult,
  FindTeamsQuery,
  FindTeamsResult,
} from './types.js';

/** Read-side query port for multi-agent collaboration discovery and inspection. */
export interface CollaborationQueries {
  findMission(query: FindMissionQuery): Promise<FindMissionResult>;

  findTeams(query: FindTeamsQuery): Promise<FindTeamsResult>;

  findOpenNegotiations(query: FindOpenNegotiationsQuery): Promise<FindOpenNegotiationsResult>;

  findPendingReviews(query: FindPendingReviewsQuery): Promise<FindPendingReviewsResult>;

  findConsensus(query: FindConsensusQuery): Promise<FindConsensusQueryResult>;
}
