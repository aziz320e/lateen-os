/** @module step/types */
import type { DecisionId } from '@lateen-os/decision-engine';
import type { TaskId } from '@lateen-os/ai-runtime';
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  AITaskRefId,
  DecisionTaskId,
  EmployeeId,
  HumanTaskId,
  OrganizationId,
  ServiceTaskId,
  StepInstanceId,
  WorkflowStepId,
} from '../shared/identifiers.js';
import type { ServiceReference, Timestamp } from '../shared/primitives.js';

export type { WorkflowStepId, StepInstanceId };

export type StepType = 'human' | 'ai' | 'service' | 'decision' | 'gateway' | 'subprocess';

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

/** Runtime instance of a step within a workflow execution. */
export interface StepInstance extends TenantAuditableEntity<StepInstanceId> {
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
}

export type { OrganizationId, HumanTaskId, AITaskRefId, ServiceTaskId, DecisionTaskId };
