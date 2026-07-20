/** @module transition/types */
import type {
  ConditionId,
  OrganizationId,
  TransitionId,
  WorkflowStepId,
} from '../shared/identifiers.js';

export type { TransitionId };

export type TransitionType = 'sequential' | 'conditional' | 'parallel' | 'default';

/** Base transition between workflow steps. */
export interface Transition {
  readonly transitionId: TransitionId;
  readonly fromStepId: WorkflowStepId;
  readonly toStepId: WorkflowStepId;
  readonly type: TransitionType;
  readonly name?: string;
}

/** Transition evaluated against workflow variables. */
export interface ConditionalTransition extends Transition {
  readonly type: 'conditional';
  readonly conditionId: ConditionId;
  readonly priority: number;
}

/** Parallel fork or join between steps. */
export interface ParallelTransition extends Transition {
  readonly type: 'parallel';
  readonly fork: boolean;
  readonly joinRequiredCount?: number;
  readonly branchStepIds: readonly WorkflowStepId[];
}

export type { OrganizationId, WorkflowStepId, ConditionId };
