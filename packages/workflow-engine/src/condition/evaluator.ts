/**
 * Condition evaluation port.
 *
 * @module condition/evaluator
 */
import type { Expression } from './types.js';

/** Port for evaluating an {@link Expression} against workflow instance variables. */
export interface ConditionEvaluator {
  evaluate(expression: Expression, variables: Readonly<Record<string, unknown>>): boolean;
}
