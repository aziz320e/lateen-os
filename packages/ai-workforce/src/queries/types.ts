/** @module queries/types */
import type { OrganizationId, TaskId, TeamId, WorkerId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { AvailabilitySnapshot } from '../availability/types.js';
import type { TaskAssignment } from '../collaboration/types.js';
import type { AIWorker, WorkerStatus } from '../worker/types.js';
import type { AITeam, TeamStatus } from '../teams/types.js';
import type { Goal, GoalStatus } from '../goals/types.js';
import type { PerformanceMetrics, TaskStatistics, WorkerScore } from '../performance/types.js';

export interface FindWorkersQuery extends OrganizationScopedQuery {
  readonly status?: WorkerStatus;
  readonly workforceType?: string;
  readonly teamId?: TeamId;
  readonly departmentId?: string;
}

export interface FindWorkersResult {
  readonly workers: readonly AIWorker[];
  readonly total: number;
}

export interface FindTeamsQuery extends OrganizationScopedQuery {
  readonly status?: TeamStatus;
  readonly workerId?: WorkerId;
}

export interface FindTeamsResult {
  readonly teams: readonly AITeam[];
  readonly total: number;
}

export interface FindGoalsQuery extends OrganizationScopedQuery {
  readonly status?: GoalStatus;
  readonly workerId?: WorkerId;
  readonly teamId?: TeamId;
}

export interface FindGoalsResult {
  readonly goals: readonly Goal[];
  readonly total: number;
}

export interface FindPerformanceQuery extends OrganizationScopedQuery {
  readonly workerId: WorkerId;
  readonly period?: string;
}

export interface FindPerformanceResult {
  readonly metrics: readonly PerformanceMetrics[];
  readonly score: WorkerScore | null;
  readonly taskStatistics: TaskStatistics | null;
}

export interface FindAssignmentsQuery extends OrganizationScopedQuery {
  readonly workerId?: WorkerId;
  readonly taskId?: TaskId;
  readonly status?: string;
}

export interface FindAssignmentsResult {
  readonly assignments: readonly TaskAssignment[];
  readonly total: number;
}

export interface FindAvailabilityQuery {
  readonly organizationId: OrganizationId;
  readonly workerId?: WorkerId;
  readonly at?: string;
}

export interface FindAvailabilityResult {
  readonly snapshots: readonly AvailabilitySnapshot[];
}

export type { OrganizationId, WorkerId, TeamId, TaskId };
