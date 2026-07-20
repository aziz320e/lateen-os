/** @module evaluation/value-objects */
import type { EvaluationCriteria, EvaluationScore } from './types.js';

/** Weighted criteria set for an evaluation run. */
export interface WeightedCriteriaSet {
  readonly criteria: readonly EvaluationCriteria[];
  readonly scores: readonly EvaluationScore[];
}
