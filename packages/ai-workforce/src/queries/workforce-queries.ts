/** @module queries/workforce-queries */
import type {
  FindAssignmentsQuery,
  FindAssignmentsResult,
  FindAvailabilityQuery,
  FindAvailabilityResult,
  FindGoalsQuery,
  FindGoalsResult,
  FindPerformanceQuery,
  FindPerformanceResult,
  FindTeamsQuery,
  FindTeamsResult,
  FindWorkersQuery,
  FindWorkersResult,
} from './types.js';

/** Read-side query port for AI Workforce discovery and inspection. */
export interface WorkforceQueries {
  findWorkers(query: FindWorkersQuery): Promise<FindWorkersResult>;

  findTeams(query: FindTeamsQuery): Promise<FindTeamsResult>;

  findGoals(query: FindGoalsQuery): Promise<FindGoalsResult>;

  findPerformance(query: FindPerformanceQuery): Promise<FindPerformanceResult>;

  findAssignments(query: FindAssignmentsQuery): Promise<FindAssignmentsResult>;

  findAvailability(query: FindAvailabilityQuery): Promise<FindAvailabilityResult>;
}
