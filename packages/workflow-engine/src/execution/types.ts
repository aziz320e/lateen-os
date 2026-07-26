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

export type RetryBackoffStrategy = 'fixed' | 'exponential';

/** Declarative retry policy attachable to a workflow step definition. */
export interface RetryPolicy {
  /** Total attempts allowed, including the first. Must be >= 1. */
  readonly maxAttempts: number;
  readonly backoff: RetryBackoffStrategy;
  readonly initialDelayMs: number;
  /** Caps the computed delay for 'exponential' backoff. Ignored for 'fixed'. */
  readonly maxDelayMs?: number;
}

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
  readonly organizationId: OrganizationId;
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

/** Port for workflow orchestration. Real implementation: {@link createWorkflowOrchestrator}. */
export interface WorkflowOrchestrator {
  dispatch(command: ExecutionCommand): Promise<ExecutionHandoff>;
  advance(organizationId: OrganizationId, instanceId: WorkflowInstanceId): Promise<WorkflowExecutionId>;
  suspend(organizationId: OrganizationId, instanceId: WorkflowInstanceId, reason: string): Promise<void>;
  resume(organizationId: OrganizationId, instanceId: WorkflowInstanceId): Promise<void>;
  cancel(organizationId: OrganizationId, instanceId: WorkflowInstanceId, reason: string): Promise<void>;
}

export type { OrganizationId, WorkflowInstanceId, WorkflowExecutionId };
