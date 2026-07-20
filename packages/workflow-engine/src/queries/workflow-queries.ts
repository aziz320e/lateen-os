/** @module queries/workflow-queries */
import type {
  FindHistoryQuery,
  FindHistoryResult,
  FindRunningWorkflowsQuery,
  FindRunningWorkflowsResult,
  FindWaitingTasksQuery,
  FindWaitingTasksResult,
  FindWorkflowQuery,
  FindWorkflowResult,
} from './types.js';

/** Read-side query port for workflow discovery and inspection. */
export interface WorkflowQueries {
  findWorkflow(query: FindWorkflowQuery): Promise<FindWorkflowResult>;

  findRunningWorkflows(query: FindRunningWorkflowsQuery): Promise<FindRunningWorkflowsResult>;

  findWaitingTasks(query: FindWaitingTasksQuery): Promise<FindWaitingTasksResult>;

  findHistory(query: FindHistoryQuery): Promise<FindHistoryResult>;
}
