/** @module queries/project-queries */
import type {
  FindAssignmentsQuery,
  FindAssignmentsResult,
  FindBudgetsQuery,
  FindBudgetsResult,
  FindDeliverablesQuery,
  FindDeliverablesResult,
  FindMilestonesQuery,
  FindMilestonesResult,
  FindProjectsQuery,
  FindProjectsResult,
  FindRisksQuery,
  FindRisksResult,
  FindSchedulesQuery,
  FindSchedulesResult,
  FindTasksQuery,
  FindTasksResult,
  SearchProjectsQuery,
  SearchProjectsResult,
} from './types.js';

/** Real, read-only Project Management Engine query port. */
export interface ProjectQueries {
  findProjects(query: FindProjectsQuery): Promise<FindProjectsResult>;
  findTasks(query: FindTasksQuery): Promise<FindTasksResult>;
  findMilestones(query: FindMilestonesQuery): Promise<FindMilestonesResult>;
  findAssignments(query: FindAssignmentsQuery): Promise<FindAssignmentsResult>;
  findSchedules(query: FindSchedulesQuery): Promise<FindSchedulesResult>;
  findBudgets(query: FindBudgetsQuery): Promise<FindBudgetsResult>;
  findRisks(query: FindRisksQuery): Promise<FindRisksResult>;
  findDeliverables(query: FindDeliverablesQuery): Promise<FindDeliverablesResult>;
  searchProjects(query: SearchProjectsQuery): Promise<SearchProjectsResult>;
}
