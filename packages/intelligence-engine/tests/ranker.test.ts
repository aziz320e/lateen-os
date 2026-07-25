import { describe, expect, it } from 'vitest';
import { createRanker } from '../src/ranking/ranker.impl.js';

describe('createRanker', () => {
  it('ranks items descending by score for a standard strategy', () => {
    const ranker = createRanker();
    const result = ranker.rank('org-1', 'score_desc', 'product', [
      { subjectId: 'a', score: '0.5' },
      { subjectId: 'b', score: '0.9' },
      { subjectId: 'c', score: '0.1' },
    ]);
    expect(result.items.map((item) => item.subjectId)).toEqual(['b', 'a', 'c']);
    expect(result.items.map((item) => item.rank)).toEqual([1, 2, 3]);
  });

  it('ranks ascending for risk_asc (lowest risk first)', () => {
    const ranker = createRanker();
    const result = ranker.rank('org-1', 'risk_asc', 'product', [
      { subjectId: 'a', score: '0.5' },
      { subjectId: 'b', score: '0.1' },
    ]);
    expect(result.items.map((item) => item.subjectId)).toEqual(['b', 'a']);
  });

  it('preserves the requested strategy and subject type in the result', () => {
    const ranker = createRanker();
    const result = ranker.rank('org-1', 'composite', 'market', []);
    expect(result.strategy).toBe('composite');
    expect(result.subjectType).toBe('market');
    expect(result.organizationId).toBe('org-1');
  });
});
