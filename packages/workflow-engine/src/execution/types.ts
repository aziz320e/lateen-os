/** @module execution/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  OrganizationId,
  StepInstanceId,
  WorkflowExecutionId,
  WorkflowInstanceId,
  WorkflowStepId,
} from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';

export type ExecutionStatus = 'queued' | 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled';

/** Coordination record for a single step execution attempt. */
export interface StepExecution {
  readonly stepInstanceId: StepInstanceId;
  readonly stepId: WorkflowStepId;
  readonly executionId: WorkflowExecutionId;
  readonly status: ExecutionStatus;
  readonly attempt: number;
  readonly startedAt: Timestamp;
  readonly completedAt?: Timestamp;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

/** Orchestration command — engine coordinates, does not execute business logic. */
export interface ExecutionCommand {
  readonly instanceId: WorkflowInstanceId;
  readonly stepId: WorkflowStepId;
  readonly command: 'start' | 'complete' | 'fail' | 'skip' | 'retry' | 'cancel';
  readonly variables?: Readonly<Record<string, unknown>>;
  readonly issuedAt: Timestamp;
  readonly issuedBy?: string;
}

/** Result returned after coordinating a step handoff. */
export interface ExecutionHandoff {
  readonly instanceId: WorkflowInstanceId;
  readonly stepInstanceId: StepInstanceId;
  readonly target: 'human' | 'ai_worker' | 'service' | 'decision_engine';
  readonly referenceId: string;
  readonly status: ExecutionStatus;
}

/** Port for workflow orchestration — implementation lives outside this package. */
export interface WorkflowOrchestrator {
  dispatch(command: ExecutionCommand): Promise<ExecutionHandoff>;
  advance(instanceId: WorkflowInstanceId): Promise<WorkflowExecutionId>;
  suspend(instanceId: WorkflowInstanceId, reason: string): Promise<void>;
  resume(instanceId: WorkflowInstanceId): Promise<void>;
  cancel(instanceId: WorkflowInstanceId, reason: string): Promise<void>;
}

export type { OrganizationId, WorkflowInstanceId, WorkflowExecutionId };
