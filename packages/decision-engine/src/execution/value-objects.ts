/** @module execution/value-objects */
import type { ExecutionStep, RollbackPlan } from './types.js';

/** Execution plan with optional rollback. */
export interface ExecutionPlanBundle {
  readonly steps: readonly ExecutionStep[];
  readonly rollback?: RollbackPlan;
}
