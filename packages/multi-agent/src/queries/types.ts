/** @module queries/types */
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { MissionId, MissionTeamId, NegotiationId, ReviewRequestId, ConsensusResultId } from '../shared/identifiers.js';
import type { MissionWorkerRole } from '../shared/primitives.js';
import type { Mission, MissionStatus } from '../mission/types.js';
import type { MissionTeam } from '../team/types.js';
import type { Negotiation, NegotiationStatus } from '../negotiation/types.js';
import type { ReviewRequest, ReviewStatus } from '../review/types.js';
import type { ConsensusResult } from '../consensus/types.js';
import type { AgentAvailability, AgentRegistration } from '../agent/types.js';
import type { Conflict, ConflictStatus } from '../conflict/types.js';
import type { SharedWorkingMemoryEntry } from '../working-memory/types.js';
import type { AgentSession } from '../session/types.js';
import type { CoordinationPlan, CoordinationStep } from '../coordination/types.js';

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

export interface FindAgentsQuery extends OrganizationScopedQuery {
  readonly role?: MissionWorkerRole;
  readonly availability?: AgentAvailability;
}

export interface FindAgentsResult {
  readonly agents: readonly AgentRegistration[];
  readonly total: number;
}

export interface FindConflictsQuery extends OrganizationScopedQuery {
  readonly missionId?: MissionId;
  readonly status?: ConflictStatus;
}

export interface FindConflictsResult {
  readonly conflicts: readonly Conflict[];
  readonly total: number;
}

export interface FindWorkingMemoryQuery extends OrganizationScopedQuery {
  readonly missionId: MissionId;
  readonly key?: string;
}

export interface FindWorkingMemoryResult {
  readonly entries: readonly SharedWorkingMemoryEntry[];
  readonly total: number;
}

export interface FindActiveSessionsQuery extends OrganizationScopedQuery {
  readonly missionId: MissionId;
}

export interface FindActiveSessionsResult {
  readonly sessions: readonly AgentSession[];
  readonly total: number;
}

export interface FindCoordinationPlanQuery extends OrganizationScopedQuery {
  readonly missionId: MissionId;
}

export interface FindCoordinationPlanResult {
  readonly plan: CoordinationPlan | null;
  readonly steps: readonly CoordinationStep[];
}
