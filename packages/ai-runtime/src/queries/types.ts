/** @module queries/types */
import type { Agent } from '../agent/types.js';
import type { Conversation } from '../conversation/types.js';
import type { ExecutionResult } from '../execution/types.js';
import type {
  ConversationId,
  ExecutionPlanId,
  OrganizationId,
  RuntimeAgentId,
  RuntimeSessionId,
  TaskId,
} from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { RuntimeSession, RuntimeState } from '../runtime/types.js';
import type { Task } from '../task/types.js';

export interface FindAgentQuery extends OrganizationScopedQuery {
  readonly runtimeAgentId?: RuntimeAgentId;
}

export interface FindAgentResult {
  readonly agents: readonly Agent[];
}

export interface FindTasksQuery extends OrganizationScopedQuery {
  readonly runtimeAgentId?: RuntimeAgentId;
  readonly status?: Task['status'];
}

export interface FindTasksResult {
  readonly tasks: readonly Task[];
}

export interface FindSessionsQuery extends OrganizationScopedQuery {
  readonly runtimeAgentId?: RuntimeAgentId;
  readonly state?: RuntimeState;
}

export interface FindSessionsResult {
  readonly sessions: readonly RuntimeSession[];
}

export interface FindConversationsQuery extends OrganizationScopedQuery {
  readonly runtimeAgentId?: RuntimeAgentId;
  readonly conversationId?: ConversationId;
}

export interface FindConversationsResult {
  readonly conversations: readonly Conversation[];
}

export interface FindRuntimeStateQuery {
  readonly organizationId: OrganizationId;
  readonly sessionId?: RuntimeSessionId;
}

export interface FindRuntimeStateResult {
  readonly state: RuntimeState;
  readonly activeSessionCount: number;
  readonly queuedTaskCount: number;
}

export interface FindExecutionHistoryQuery extends OrganizationScopedQuery {
  readonly taskId?: TaskId;
  readonly planId?: ExecutionPlanId;
}

export interface FindExecutionHistoryResult {
  readonly results: readonly ExecutionResult[];
}
