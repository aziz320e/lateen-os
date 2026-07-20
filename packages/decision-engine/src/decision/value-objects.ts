/** @module decision/value-objects */
import type { DecisionCategory, DecisionStatus } from './types.js';

/** Decision lifecycle state label. */
export interface DecisionLifecycleState {
  readonly status: DecisionStatus;
  readonly category: DecisionCategory;
}
