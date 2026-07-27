/** @module queries/runtime-queries */
import type {
  FindAssignmentsQuery,
  FindAssignmentsResult,
  FindPerformanceQuery,
  FindPerformanceResult,
  FindWorkersQuery,
  FindWorkersResult,
} from './types.js';
import type {
  FindAvailableWorkersQuery,
  FindAvailableWorkersResult,
  FindCapabilitiesQuery,
  FindCapabilitiesResult,
  FindCapacityQuery,
  FindCapacityResult,
} from './runtime-types.js';

/**
 * Real-time read-side query port for the AI Workforce runtime. Composed
 * purely over repositories and engines — never exposes a repository
 * directly.
 */
export interface WorkforceRuntimeQueries {
  findWorkers(query: FindWorkersQuery): Promise<FindWorkersResult>;

  findAvailableWorkers(query: FindAvailableWorkersQuery): Promise<FindAvailableWorkersResult>;

  findAssignments(query: FindAssignmentsQuery): Promise<FindAssignmentsResult>;

  findCapabilities(query: FindCapabilitiesQuery): Promise<FindCapabilitiesResult>;

  findPerformance(query: FindPerformanceQuery): Promise<FindPerformanceResult>;

  findCapacity(query: FindCapacityQuery): Promise<FindCapacityResult>;
}
