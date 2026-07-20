/** @module instance/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  OrganizationId,
  StepInstanceId,
  WorkflowDefinitionId,
  WorkflowExecutionId,
  WorkflowInstanceId,
  WorkflowStepId,
  WorkflowVersionId,
} from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';

export type { WorkflowInstanceId, WorkflowExecutionId };

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'waiting'
  | 'suspended'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'terminated';

export type WorkflowExecutionPhase =
  | 'initializing'
  | 'executing'
  | 'waiting_approval'
  | 'waiting_task'
  | 'completing'
  | 'finalizing';

/** Running instance of a workflow definition. */
export interface WorkflowInstance extends TenantAuditableEntity<WorkflowInstanceId> {
  readonly definitionId: WorkflowDefinitionId;
  readonly versionId: WorkflowVersionId;
  readonly status: WorkflowStatus;
  readonly currentStepId?: WorkflowStepId;
  readonly currentStepInstanceId?: StepInstanceId;
  readonly startedAt: Timestamp;
  readonly completedAt?: Timestamp;
  readonly startedBy?: string;
  readonly correlationId?: string;
  readonly variables: Readonly<Record<string, unknown>>;
}

/** Active execution context for a workflow instance. */
export interface WorkflowExecution extends TenantAuditableEntity<WorkflowExecutionId> {
  readonly instanceId: WorkflowInstanceId;
  readonly phase: WorkflowExecutionPhase;
  readonly activeStepInstanceIds: readonly StepInstanceId[];
  readonly startedAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly errorMessage?: string;
}

export type { OrganizationId, WorkflowDefinitionId, WorkflowVersionId };
