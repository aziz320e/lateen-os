/** @module step/types */
import type { DecisionId } from '@lateen-os/decision-engine';
import type { TaskId } from '@lateen-os/ai-runtime';
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { RetryPolicy } from '../execution/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  AITaskRefId,
  DecisionTaskId,
  EmployeeId,
  HumanTaskId,
  OrganizationId,
  ServiceTaskId,
  StepInstanceId,
  WorkflowInstanceId,
  WorkflowStepId,
} from '../shared/identifiers.js';
import type { ServiceReference, Timestamp } from '../shared/primitives.js';

export type { WorkflowStepId, StepInstanceId };

export type StepType = 'human' | 'ai' | 'service' | 'decision' | 'gateway' | 'subprocess' | 'wait';

export type StepInstanceStatus =
  | 'pending'
  | 'ready'
  | 'active'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'cancelled';

/** Base workflow step in a definition. */
export interface WorkflowStep {
  readonly stepId: WorkflowStepId;
  readonly code: string;
  readonly name: string;
  readonly type: StepType;
  readonly description?: string;
  readonly optional: boolean;
  /** Applied by the executor when this step's handler throws or reports failure. */
  readonly retryPolicy?: RetryPolicy;
  /** Step to run as compensation if a later step in the same instance fails irrecoverably. */
  readonly compensationStepId?: WorkflowStepId;
}

/** Human-assigned task step. */
export interface HumanTask extends WorkflowStep {
  readonly type: 'human';
  readonly assigneeEmployeeId?: EmployeeId;
  readonly assigneeRoleId?: string;
  readonly dueInMinutes?: number;
  readonly formSchemaRef?: string;
}

/** AI worker task step — delegates to AI Workforce + AI Runtime. */
export interface AITask extends WorkflowStep {
  readonly type: 'ai';
  readonly workerId?: WorkerId;
  readonly runtimeTaskId?: TaskId;
  readonly taskTemplate: string;
  readonly inputVariableKeys: readonly string[];
}

/** External service invocation step. */
export interface ServiceTask extends WorkflowStep {
  readonly type: 'service';
  readonly serviceRef: ServiceReference;
  readonly operation: string;
  readonly inputVariableKeys: readonly string[];
  readonly outputVariableKey?: string;
}

/** Decision Engine submission step. */
export interface DecisionTask extends WorkflowStep {
  readonly type: 'decision';
  readonly decisionId?: DecisionId;
  readonly decisionCategory: string;
  readonly inputVariableKeys: readonly string[];
}

/** Delay step — suspends the instance until a relative duration or absolute timestamp elapses. */
export interface WaitStep extends WorkflowStep {
  readonly type: 'wait';
  /** Relative delay from when this step starts. Ignored if `resumeAt` is set. */
  readonly durationMs?: number;
  /** Absolute resume time. Takes precedence over `durationMs`. */
  readonly resumeAt?: Timestamp;
}

/** Runtime instance of a step within a workflow execution. */
export interface StepInstance extends TenantAuditableEntity<StepInstanceId> {
  readonly instanceId: WorkflowInstanceId;
  readonly stepId: WorkflowStepId;
  readonly stepType: StepType;
  readonly status: StepInstanceStatus;
  readonly humanTaskId?: HumanTaskId;
  readonly aiTaskRefId?: AITaskRefId;
  readonly serviceTaskId?: ServiceTaskId;
  readonly decisionTaskId?: DecisionTaskId;
  readonly startedAt?: Timestamp;
  readonly completedAt?: Timestamp;
  readonly output?: Readonly<Record<string, unknown>>;
  /** Number of execution attempts made so far (1 after the first attempt). */
  readonly attempt: number;
  readonly errorMessage?: string;
  /** Set when this instance is a compensation run — references the step it compensates. */
  readonly compensationOf?: WorkflowStepId;
  /** Set on a completed step once its compensation has run after a later failure. */
  readonly compensatedAt?: Timestamp;
  /** Absolute time a "wait" step instance resumes at. */
  readonly resumeAt?: Timestamp;
}

export type { OrganizationId, HumanTaskId, AITaskRefId, ServiceTaskId, DecisionTaskId };
