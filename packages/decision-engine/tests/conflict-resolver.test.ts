import { describe, expect, it } from 'vitest';
import { createConflictResolver } from '../src/reasoning/conflict-resolver.impl.js';
import type { Recommendation } from '../src/recommendation/types.js';

const now = new Date().toISOString();

function makeRecommendation(id: string, decisionId: string, action: string, score: string): Recommendation {
  return {
    id,
    organizationId: 'org-1',
    createdAt: now,
    updatedAt: now,
    decisionId,
    title: `Rec ${id}`,
    summary: 'summary',
    proposedAction: action,
    score: { value: score, confidence: '0.8' },
    alternatives: [],
    status: 'proposed',
  };
}

describe('createConflictResolver', () => {
  it('detects no conflict when recommendations agree on the action', async () => {
    const resolver = createConflictResolver();
    const conflicts = await resolver.detectConflicts([
      makeRecommendation('r1', 'd1', 'approve', '0.7'),
      makeRecommendation('r2', 'd1', 'approve', '0.6'),
    ]);
    expect(conflicts).toHaveLength(0);
  });

  it('detects a conflict when recommendations for the same decision propose different actions', async () => {
    const resolver = createConflictResolver();
    const conflicts = await resolver.detectConflicts([
      makeRecommendation('r1', 'd1', 'approve', '0.7'),
      makeRecommendation('r2', 'd1', 'reject', '0.6'),
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.decisionId).toBe('d1');
  });

  it('does not flag a single recommendation as a conflict', async () => {
    const resolver = createConflictResolver();
    const conflicts = await resolver.detectConflicts([makeRecommendation('r1', 'd1', 'approve', '0.7')]);
    expect(conflicts).toHaveLength(0);
  });

  it('resolves a conflict by selecting the highest-scored recommendation', async () => {
    const resolver = createConflictResolver();
    const conflicts = await resolver.detectConflicts([
      makeRecommendation('r1', 'd1', 'approve', '0.4'),
      makeRecommendation('r2', 'd1', 'reject', '0.9'),
    ]);
    const resolution = await resolver.resolve(conflicts[0]!);
    expect(resolution.winningRecommendationId).toBe('r2');
  });

  it('resolves gracefully when a conflict carries no recommendations', async () => {
    const resolver = createConflictResolver();
    const resolution = await resolver.resolve({ decisionId: 'd1', code: 'X', description: 'manual conflict' });
    expect(resolution.winningRecommendationId).toBeUndefined();
  });
});
