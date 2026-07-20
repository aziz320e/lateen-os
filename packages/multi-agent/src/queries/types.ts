/** @module queries/types */
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { MissionId, MissionTeamId, NegotiationId, ReviewRequestId, ConsensusResultId } from '../shared/identifiers.js';
import type { Mission, MissionStatus } from '../mission/types.js';
import type { MissionTeam } from '../team/types.js';
import type { Negotiation, NegotiationStatus } from '../negotiation/types.js';
import type { ReviewRequest, ReviewStatus } from '../review/types.js';
import type { ConsensusResult } from '../consensus/types.js';

export interface FindMissionQuery extends OrganizationScopedQuery {
  readonly missionId?: MissionId;
  readonly code?: string;
  readonly status?: MissionStatus;
}

export interface FindMissionResult {
  readonly missions: readonly Mission[];
  readonly total: number;
}

export interface FindTeamsQuery extends OrganizationScopedQuery {
  readonly missionId?: MissionId;
  readonly teamId?: MissionTeamId;
}

export interface FindTeamsResult {
  readonly teams: readonly MissionTeam[];
  readonly total: number;
}

export interface FindOpenNegotiationsQuery extends OrganizationScopedQuery {
  readonly missionId?: MissionId;
  readonly status?: NegotiationStatus;
}

export interface FindOpenNegotiationsResult {
  readonly negotiations: readonly Negotiation[];
  readonly total: number;
}

export interface FindPendingReviewsQuery extends OrganizationScopedQuery {
  readonly missionId?: MissionId;
  readonly status?: ReviewStatus;
  readonly reviewerWorkerId?: string;
}

export interface FindPendingReviewsResult {
  readonly reviews: readonly ReviewRequest[];
  readonly total: number;
}

export interface FindConsensusQuery extends OrganizationScopedQuery {
  readonly missionId?: MissionId;
  readonly consensusResultId?: ConsensusResultId;
  readonly negotiationId?: NegotiationId;
  readonly reached?: boolean;
}

export interface FindConsensusQueryResult {
  readonly results: readonly ConsensusResult[];
  readonly total: number;
}
