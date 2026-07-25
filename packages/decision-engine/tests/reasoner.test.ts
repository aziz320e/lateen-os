import { describe, expect, it } from 'vitest';
import { createReasoner } from '../src/reasoning/reasoner.impl.js';
import type { Decision } from '../src/decision/types.js';
import type { Recommendation } from '../src/recommendation/types.js';

const now = new Date().toISOString();

function makeDecision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: 'd1',
    organizationId: 'org-1',
    createdAt: now,
    updatedAt: now,
    title: 'Test decision',
    description: 'desc',
    category: 'approval',
    status: 'evaluating',
    requestedBy: { type: 'agent' },
    requestedAt: now,
    confidence: '0.8',
    risk: 'low',
    priority: 'normal',
    ...overrides,
  };
}

function makeRecommendation(value: string, confidence = '0.8'): Recommendation {
  return {
    id: `r-${value}`,
    organizationId: 'org-1',
    createdAt: now,
    updatedAt: now,
    decisionId: 'd1',
    title: 'Rec',
    summary: 'summary',
    proposedAction: 'act',
    score: { value, confidence },
    alternatives: [],
    status: 'proposed',
  };
}

describe('createReasoner', () => {
  it('passes a decision with strong recommendations and low risk', async () => {
    const reasoner = createReasoner();
    const result = await reasoner.reason({
      decision: makeDecision({ risk: 'low' }),
      context: {} as never,
      recommendations: [makeRecommendation('0.9'), makeRecommendation('0.85')],
    });

    expect(result.passed).toBe(true);
    expect(parseFloat(result.overallScore)).toBeGreaterThan(0.5);
    expect(result.decisionId).toBe('d1');
  });

  it('fails a decision with weak recommendations even at low risk', async () => {
    const reasoner = createReasoner();
    const result = await reasoner.reason({
      decision: makeDecision({ risk: 'low' }),
      context: {} as never,
      recommendations: [makeRecommendation('0.2')],
    });

    expect(result.passed).toBe(false);
  });

  it('applies a larger penalty for critical risk than for low risk', async () => {
    const reasoner = createReasoner();
    const recommendations = [makeRecommendation('0.7')];

    const lowRiskResult = await reasoner.reason({
      decision: makeDecision({ risk: 'low' }),
      context: {} as never,
      recommendations,
    });
    const criticalRiskResult = await reasoner.reason({
      decision: makeDecision({ risk: 'critical' }),
      context: {} as never,
      recommendations,
    });

    expect(parseFloat(criticalRiskResult.overallScore)).toBeLessThan(parseFloat(lowRiskResult.overallScore));
  });

  it('handles zero recommendations deterministically without throwing', async () => {
    const reasoner = createReasoner();
    const result = await reasoner.reason({
      decision: makeDecision(),
      context: {} as never,
      recommendations: [],
    });
    expect(result.passed).toBe(false);
    expect(result.overallScore).toBe('0.00');
  });
});
