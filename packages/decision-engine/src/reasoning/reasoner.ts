/**
 * Reasoning ports for the Decision Engine.
 *
 * Implementations live outside this package. No AI or business logic here.
 *
 * @module reasoning/reasoner
 */

import type { Decision } from '../decision/types.js';
import type { DecisionContext } from '../context/types.js';
import type { EvaluationResult } from '../evaluation/types.js';
import type { Recommendation } from '../recommendation/types.js';

/** Input bundle for reasoning over a decision. */
export interface ReasoningInput {
  readonly decision: Decision;
  readonly context: DecisionContext;
  readonly recommendations: readonly Recommendation[];
}

/** Port for applying reasoning strategies to a decision (contract only). */
export interface Reasoner {
  reason(input: ReasoningInput): Promise<EvaluationResult>;
}
