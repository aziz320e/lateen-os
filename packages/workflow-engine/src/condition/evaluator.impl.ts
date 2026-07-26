/**
 * Real, deterministic condition evaluation — no `eval`, no arbitrary code
 * execution. Supports two of the three declared {@link ExpressionLanguage}s:
 *
 * - `'simple'`: comparison clauses (`path == value`, `path > value`, ...)
 *   combined with ` && ` / ` || ` (OR of ANDs, no parentheses).
 * - `'jsonlogic'`: a real subset of JsonLogic — `==`, `!=`, `>`, `>=`, `<`,
 *   `<=`, `and`, `or`, `!`, `var`, `in`.
 *
 * `'cel'` has no implementation here (out of scope for this pass) and
 * throws {@link UnsupportedExpressionLanguageError} rather than silently
 * approximating it — bring your own evaluator for it.
 *
 * @module condition/evaluator.impl
 */
import { ConditionEvaluationError, UnsupportedExpressionLanguageError } from '../shared/errors.js';
import type { ConditionEvaluator } from './evaluator.js';
import type { Expression } from './types.js';

type Variables = Readonly<Record<string, unknown>>;

function getPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value === null || value === undefined || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

function parseLiteral(raw: string): unknown {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed !== '' && !Number.isNaN(Number(trimmed))) return Number(trimmed);
  return trimmed;
}

const CLAUSE_PATTERN = /^(\S+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/;

function compare(left: unknown, operator: string, right: unknown): boolean {
  switch (operator) {
    case '==':
      return left === right;
    case '!=':
      return left !== right;
    case '>':
      return Number(left) > Number(right);
    case '>=':
      return Number(left) >= Number(right);
    case '<':
      return Number(left) < Number(right);
    case '<=':
      return Number(left) <= Number(right);
    default:
      throw new ConditionEvaluationError(`Unsupported operator "${operator}"`);
  }
}

function evaluateSimple(source: string, variables: Variables): boolean {
  const orGroups = source.split(' || ');
  return orGroups.some((group) =>
    group.split(' && ').every((rawClause) => {
      const clause = rawClause.trim();
      const match = CLAUSE_PATTERN.exec(clause);
      if (!match) {
        throw new ConditionEvaluationError(`Malformed 'simple' clause: "${clause}"`);
      }
      const [, path, operator, rawValue] = match;
      return compare(getPath(variables, path!), operator!, parseLiteral(rawValue!));
    }),
  );
}

type JsonLogicNode = unknown;

function evaluateJsonLogic(node: JsonLogicNode, variables: Variables): unknown {
  if (Array.isArray(node)) {
    return node.map((item) => evaluateJsonLogic(item, variables));
  }
  if (node === null || typeof node !== 'object') {
    return node;
  }

  const entries = Object.entries(node as Record<string, unknown>);
  if (entries.length !== 1) {
    throw new ConditionEvaluationError('Malformed JsonLogic node: expected exactly one operator key');
  }
  const [operator, rawArgs] = entries[0]!;
  const args = Array.isArray(rawArgs) ? rawArgs : [rawArgs];

  switch (operator) {
    case 'var': {
      const [pathArg, defaultValue] = args;
      const value = getPath(variables, String(evaluateJsonLogic(pathArg, variables)));
      return value === undefined ? (defaultValue !== undefined ? evaluateJsonLogic(defaultValue, variables) : null) : value;
    }
    case '==':
      return evaluateJsonLogic(args[0], variables) === evaluateJsonLogic(args[1], variables);
    case '!=':
      return evaluateJsonLogic(args[0], variables) !== evaluateJsonLogic(args[1], variables);
    case '>':
      return Number(evaluateJsonLogic(args[0], variables)) > Number(evaluateJsonLogic(args[1], variables));
    case '>=':
      return Number(evaluateJsonLogic(args[0], variables)) >= Number(evaluateJsonLogic(args[1], variables));
    case '<':
      return Number(evaluateJsonLogic(args[0], variables)) < Number(evaluateJsonLogic(args[1], variables));
    case '<=':
      return Number(evaluateJsonLogic(args[0], variables)) <= Number(evaluateJsonLogic(args[1], variables));
    case 'and':
      return args.every((arg) => Boolean(evaluateJsonLogic(arg, variables)));
    case 'or':
      return args.some((arg) => Boolean(evaluateJsonLogic(arg, variables)));
    case '!':
      return !evaluateJsonLogic(args[0], variables);
    case 'in': {
      const needle = evaluateJsonLogic(args[0], variables);
      const haystack = evaluateJsonLogic(args[1], variables);
      if (typeof haystack === 'string') return haystack.includes(String(needle));
      if (Array.isArray(haystack)) return haystack.includes(needle);
      return false;
    }
    default:
      throw new ConditionEvaluationError(`Unsupported JsonLogic operator "${operator}"`);
  }
}

/** Creates a real {@link ConditionEvaluator} for `'simple'` and `'jsonlogic'` expressions. */
export function createConditionEvaluator(): ConditionEvaluator {
  return {
    evaluate(expression: Expression, variables: Variables): boolean {
      switch (expression.language) {
        case 'simple':
          return evaluateSimple(expression.source, variables);
        case 'jsonlogic': {
          let parsed: unknown;
          try {
            parsed = JSON.parse(expression.source);
          } catch (error) {
            throw new ConditionEvaluationError(`Invalid JsonLogic JSON in expression "${expression.id}"`, error);
          }
          return Boolean(evaluateJsonLogic(parsed, variables));
        }
        case 'cel':
          throw new UnsupportedExpressionLanguageError('cel');
        default:
          throw new UnsupportedExpressionLanguageError(expression.language);
      }
    },
  };
}
