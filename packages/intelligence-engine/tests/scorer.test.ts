import { describe, expect, it } from 'vitest';
import { computeCompositeScore, createScorer } from '../src/scoring/scorer.impl.js';

describe('computeCompositeScore', () => {
  it('returns 0 when no sub-scores are provided', () => {
    expect(computeCompositeScore({})).toBe('0.0000');
  });

  it('normalizes by weight-sum so a single maxed sub-score always yields the max composite', () => {
    // computeCompositeScore averages by the weight of whichever sub-scores are
    // present (not present = excluded, not zero), so any single fully-maxed
    // input yields 1.0 regardless of which sub-score it is.
    expect(computeCompositeScore({ demand: { value: '1.0' } })).toBe('1.0000');
    expect(computeCompositeScore({ complexity: { value: '0.0' } })).toBe('1.0000');
  });

  it('blends a strong sub-score with a weak one proportionally to their weights', () => {
    // demand (weight 0.25) at max, complexity (weight 0.1, inverted) at worst (contributes 0):
    // composite = (1.0*0.25 + 0*0.1) / (0.25+0.1) = 0.25/0.35
    const score = computeCompositeScore({ demand: { value: '1.0' }, complexity: { value: '1.0' } });
    expect(parseFloat(score)).toBeCloseTo(0.25 / 0.35, 4);
  });

  it('inverts complexity and risk (lower input -> higher contribution)', () => {
    const lowComplexity = computeCompositeScore({ complexity: { value: '0.1' } });
    const highComplexity = computeCompositeScore({ complexity: { value: '0.9' } });
    expect(parseFloat(lowComplexity)).toBeGreaterThan(parseFloat(highComplexity));
  });

  it('respects custom weights', () => {
    const score = computeCompositeScore({ demand: { value: '1.0' }, profit: { value: '0.0' } }, { demand: 1, profit: 0 });
    expect(score).toBe('1.0000');
  });
});

describe('createScorer', () => {
  it('builds a real IntelligenceScore with a computed composite', () => {
    const scorer = createScorer();
    const score = scorer.score('org-1', 'product', 'p1', { demand: { value: '0.8' }, profit: { value: '0.6' } });
    expect(score.subjectType).toBe('product');
    expect(score.subjectId).toBe('p1');
    expect(score.organizationId).toBe('org-1');
    expect(parseFloat(score.composite)).toBeGreaterThan(0);
    expect(score.id).toBeTruthy();
  });
});
