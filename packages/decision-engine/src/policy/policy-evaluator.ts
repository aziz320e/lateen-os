/**
 * Real, deterministic policy constraint evaluator. Deliberately not an
 * `eval()`/`Function()`-based expression engine (no code-injection surface)
 * — supports simple `<field> <op> <value>` comparisons against a plain
 * context object, which covers the realistic shape of a
 * {@link PolicyConstraint} ("risk != 'critical'", "estimatedCost <= 10000").
 *
 * @module policy/policy-evaluator
 */
import { randomUUID } from 'node:crypto';
import type { DecisionPolicy, PolicyViolation } from './types.js';

export interface PolicyEvaluationOutcome {
  readonly satisfied: boolean;
  readonly violations: readonly PolicyViolation[];
}

const EXPRESSION_PATTERN = /^\s*([\w.]+)\s*(==|!=|<=|>=|<|>)\s*(.+?)\s*$/;

function getByPath(context: Record<string, unknown>, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((value, key) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined), context);
}

function parseLiteral(raw: string): unknown {
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, '');
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed !== '' && !Number.isNaN(Number(trimmed))) return Number(trimmed);
  return trimmed;
}

/** Evaluates a single constraint expression against a context object. Unparseable expressions fail open (they're a config problem, not a policy violation). */
export function evaluateExpression(expression: string, context: Record<string, unknown>): boolean {
  const match = EXPRESSION_PATTERN.exec(expression);
  if (!match) return true;
  const [, path, operator, rawValue] = match;
  const actual = getByPath(context, path!);
  const expected = parseLiteral(rawValue!);

  switch (operator) {
    case '==':
      return actual === expected;
    case '!=':
      return actual !== expected;
    case '<':
      return Number(actual) < Number(expected);
    case '<=':
      return Number(actual) <= Number(expected);
    case '>':
      return Number(actual) > Number(expected);
    case '>=':
      return Number(actual) >= Number(expected);
    default:
      return true;
  }
}

/** Evaluates every mandatory constraint on a {@link DecisionPolicy} against a context object. */
export function evaluatePolicyConstraints(
  policy: DecisionPolicy,
  context: Record<string, unknown>,
): PolicyEvaluationOutcome {
  const violations: PolicyViolation[] = [];

  for (const constraint of policy.constraints) {
    if (!constraint.mandatory || !constraint.expression) continue;
    if (!evaluateExpression(constraint.expression, context)) {
      violations.push({
        violationId: randomUUID(),
        policyId: policy.id,
        constraintCode: constraint.code,
        message: `Constraint "${constraint.description}" was not satisfied`,
      });
    }
  }

  return { satisfied: violations.length === 0, violations };
}
