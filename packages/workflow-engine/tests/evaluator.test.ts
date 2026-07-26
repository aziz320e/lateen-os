import { describe, expect, it } from 'vitest';
import { createConditionEvaluator } from '../src/condition/evaluator.impl.js';
import { UnsupportedExpressionLanguageError, ConditionEvaluationError } from '../src/shared/errors.js';
import type { Expression } from '../src/condition/types.js';

const NOW = '2026-01-01T00:00:00.000Z';

function simpleExpr(source: string): Expression {
  return { id: 'expr-1', organizationId: 'org-1', createdAt: NOW, updatedAt: NOW, language: 'simple', source };
}

function jsonLogicExpr(source: unknown): Expression {
  return { id: 'expr-2', organizationId: 'org-1', createdAt: NOW, updatedAt: NOW, language: 'jsonlogic', source: JSON.stringify(source) };
}

describe('createConditionEvaluator — simple language', () => {
  const evaluator = createConditionEvaluator();

  it('evaluates a single numeric comparison', () => {
    expect(evaluator.evaluate(simpleExpr('amount > 100'), { amount: 150 })).toBe(true);
    expect(evaluator.evaluate(simpleExpr('amount > 100'), { amount: 50 })).toBe(false);
  });

  it('evaluates dot-path variable access', () => {
    expect(evaluator.evaluate(simpleExpr('customer.tier == \'gold\''), { customer: { tier: 'gold' } })).toBe(true);
  });

  it('combines clauses with && (all must be true)', () => {
    const expr = simpleExpr("amount > 100 && status == 'approved'");
    expect(evaluator.evaluate(expr, { amount: 150, status: 'approved' })).toBe(true);
    expect(evaluator.evaluate(expr, { amount: 150, status: 'pending' })).toBe(false);
  });

  it('combines clauses with || (any may be true)', () => {
    const expr = simpleExpr("status == 'approved' || status == 'auto_approved'");
    expect(evaluator.evaluate(expr, { status: 'auto_approved' })).toBe(true);
    expect(evaluator.evaluate(expr, { status: 'rejected' })).toBe(false);
  });

  it('supports !=, >=, <=, <', () => {
    expect(evaluator.evaluate(simpleExpr('status != \'rejected\''), { status: 'pending' })).toBe(true);
    expect(evaluator.evaluate(simpleExpr('amount >= 100'), { amount: 100 })).toBe(true);
    expect(evaluator.evaluate(simpleExpr('amount <= 100'), { amount: 100 })).toBe(true);
    expect(evaluator.evaluate(simpleExpr('amount < 100'), { amount: 99 })).toBe(true);
  });

  it('throws ConditionEvaluationError for a malformed clause', () => {
    expect(() => evaluator.evaluate(simpleExpr('not a valid clause'), {})).toThrow(ConditionEvaluationError);
  });
});

describe('createConditionEvaluator — jsonlogic language', () => {
  const evaluator = createConditionEvaluator();

  it('evaluates ==, var', () => {
    expect(evaluator.evaluate(jsonLogicExpr({ '==': [{ var: 'status' }, 'approved'] }), { status: 'approved' })).toBe(true);
  });

  it('evaluates and/or/!', () => {
    const expr = jsonLogicExpr({ and: [{ '>': [{ var: 'amount' }, 100] }, { '!': [{ '==': [{ var: 'status' }, 'blocked'] }] }] });
    expect(evaluator.evaluate(expr, { amount: 150, status: 'pending' })).toBe(true);
    expect(evaluator.evaluate(expr, { amount: 150, status: 'blocked' })).toBe(false);
  });

  it('evaluates in', () => {
    const expr = jsonLogicExpr({ in: [{ var: 'status' }, ['approved', 'auto_approved']] });
    expect(evaluator.evaluate(expr, { status: 'approved' })).toBe(true);
    expect(evaluator.evaluate(expr, { status: 'rejected' })).toBe(false);
  });

  it('throws for an unsupported operator', () => {
    expect(() => evaluator.evaluate(jsonLogicExpr({ unknown_op: [1, 2] }), {})).toThrow(ConditionEvaluationError);
  });
});

describe('createConditionEvaluator — cel language', () => {
  it('throws UnsupportedExpressionLanguageError rather than approximating it', () => {
    const evaluator = createConditionEvaluator();
    const expr: Expression = { id: 'expr-3', organizationId: 'org-1', createdAt: NOW, updatedAt: NOW, language: 'cel', source: 'true' };
    expect(() => evaluator.evaluate(expr, {})).toThrow(UnsupportedExpressionLanguageError);
  });
});
