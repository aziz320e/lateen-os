/** @module queries/runtime-queries */
import type {
  FindAgentQuery,
  FindAgentResult,
  FindConversationsQuery,
  FindConversationsResult,
  FindExecutionHistoryQuery,
  FindExecutionHistoryResult,
  FindRuntimeStateQuery,
  FindRuntimeStateResult,
  FindSessionsQuery,
  FindSessionsResult,
  FindTasksQuery,
  FindTasksResult,
} from './types.js';

/** Read-side query port for AI Runtime discovery and inspection. */
export interface RuntimeQueries {
  findAgent(query: FindAgentQuery): Promise<FindAgentResult>;

  findTasks(query: FindTasksQuery): Promise<FindTasksResult>;

  findSessions(query: FindSessionsQuery): Promise<FindSessionsResult>;

  findConversations(query: FindConversationsQuery): Promise<FindConversationsResult>;

  findRuntimeState(query: FindRuntimeStateQuery): Promise<FindRuntimeStateResult>;

  findExecutionHistory(query: FindExecutionHistoryQuery): Promise<FindExecutionHistoryResult>;
}
