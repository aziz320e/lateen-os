/** @module queries/types */
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type {
  OrganizationId,
  StepInstanceId,
  WorkflowDefinitionId,
  WorkflowInstanceId,
} from '../shared/identifiers.js';
import type { AuditTrail, ExecutionHistory, WorkflowHistory } from '../history/types.js';
import type { StepInstance, WorkflowStep } from '../step/types.js';
import type { WorkflowDefinition, WorkflowVersion } from '../workflow/types.js';
import type { WorkflowInstance, WorkflowStatus } from '../instance/types.js';

export interface FindWorkflowQuery extends OrganizationScopedQuery {
  readonly definitionId?: WorkflowDefinitionId;
  readonly code?: string;
  readonly version?: string;
}

export interface FindWorkflowResult {
  readonly definition: WorkflowDefinition | null;
  readonly version: WorkflowVersion | null;
  readonly steps: readonly WorkflowStep[];
}

export interface FindRunningWorkflowsQuery extends OrganizationScopedQuery {
  readonly status?: WorkflowStatus;
  readonly definitionId?: WorkflowDefinitionId;
}

export interface FindRunningWorkflowsResult {
  readonly instances: readonly WorkflowInstance[];
  readonly total: number;
}

export interface FindWaitingTasksQuery extends OrganizationScopedQuery {
  readonly assigneeEmployeeId?: string;
  readonly workerId?: string;
  readonly instanceId?: WorkflowInstanceId;
}

export interface FindWaitingTasksResult {
  readonly stepInstances: readonly StepInstance[];
  readonly total: number;
}

export interface FindHistoryQuery extends OrganizationScopedQuery {
  readonly instanceId: WorkflowInstanceId;
  readonly stepInstanceId?: StepInstanceId;
}

export interface FindHistoryResult {
  readonly workflowHistory: readonly WorkflowHistory[];
  readonly executionHistory: readonly ExecutionHistory[];
  readonly auditTrail: readonly AuditTrail[];
}

export type { OrganizationId, WorkflowDefinitionId, WorkflowInstanceId };
