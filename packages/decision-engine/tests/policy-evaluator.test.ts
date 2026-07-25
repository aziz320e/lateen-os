import { describe, expect, it } from 'vitest';
import { evaluateExpression, evaluatePolicyConstraints } from '../src/policy/policy-evaluator.js';
import type { DecisionPolicy } from '../src/policy/types.js';

describe('evaluateExpression', () => {
  it('evaluates equality against a string field', () => {
    expect(evaluateExpression("risk == 'low'", { risk: 'low' })).toBe(true);
    expect(evaluateExpression("risk == 'low'", { risk: 'high' })).toBe(false);
  });

  it('evaluates numeric comparisons', () => {
    expect(evaluateExpression('estimatedCost <= 10000', { estimatedCost: 5000 })).toBe(true);
    expect(evaluateExpression('estimatedCost <= 10000', { estimatedCost: 20000 })).toBe(false);
    expect(evaluateExpression('score > 0.5', { score: 0.9 })).toBe(true);
  });

  it('resolves dotted field paths', () => {
    expect(evaluateExpression("decision.risk == 'critical'", { decision: { risk: 'critical' } })).toBe(true);
  });

  it('fails open for an unparseable expression', () => {
    expect(evaluateExpression('!!! not an expression', {})).toBe(true);
  });

  it('treats a missing field as failing a numeric comparison rather than throwing', () => {
    expect(evaluateExpression('missingField > 5', {})).toBe(false);
  });
});

describe('evaluatePolicyConstraints', () => {
  function makePolicy(constraints: DecisionPolicy['constraints']): DecisionPolicy {
    return {
      id: 'p1',
      organizationId: 'org-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      code: 'POL-1',
      name: 'Test',
      scope: { organizationWide: true },
      constraints,
      status: 'active',
    };
  }

  it('is satisfied when every mandatory constraint passes', () => {
    const policy = makePolicy([
      { code: 'C1', description: 'Risk must not be critical', expression: "risk != 'critical'", mandatory: true },
    ]);
    const outcome = evaluatePolicyConstraints(policy, { risk: 'low' });
    expect(outcome.satisfied).toBe(true);
    expect(outcome.violations).toHaveLength(0);
  });

  it('records a violation for each failed mandatory constraint', () => {
    const policy = makePolicy([
      { code: 'C1', description: 'Risk must not be critical', expression: "risk != 'critical'", mandatory: true },
    ]);
    const outcome = evaluatePolicyConstraints(policy, { risk: 'critical' });
    expect(outcome.satisfied).toBe(false);
    expect(outcome.violations).toHaveLength(1);
    expect(outcome.violations[0]!.constraintCode).toBe('C1');
    expect(outcome.violations[0]!.policyId).toBe('p1');
  });

  it('ignores non-mandatory constraints', () => {
    const policy = makePolicy([
      { code: 'C1', description: 'Advisory only', expression: "risk == 'low'", mandatory: false },
    ]);
    const outcome = evaluatePolicyConstraints(policy, { risk: 'high' });
    expect(outcome.satisfied).toBe(true);
  });

  it('ignores mandatory constraints with no expression', () => {
    const policy = makePolicy([{ code: 'C1', description: 'No expression', mandatory: true }]);
    const outcome = evaluatePolicyConstraints(policy, {});
    expect(outcome.satisfied).toBe(true);
  });
});
