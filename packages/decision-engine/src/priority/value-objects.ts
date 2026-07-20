/** @module priority/value-objects */
import type { PriorityLevel, PriorityStrategy } from './types.js';

/** Priority classification bundle. */
export interface PriorityClassification {
  readonly level: PriorityLevel;
  readonly strategy: PriorityStrategy;
}
