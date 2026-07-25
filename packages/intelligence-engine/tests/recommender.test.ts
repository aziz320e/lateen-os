import { describe, expect, it } from 'vitest';
import { createRecommender } from '../src/recommendation-engine/recommender.impl.js';

describe('createRecommender', () => {
  it('createCandidate produces a proposed candidate with the given fields', () => {
    const recommender = createRecommender();
    const candidate = recommender.createCandidate({
      organizationId: 'org-1',
      title: 'Launch product X',
      summary: 'summary',
      proposedAction: 'launch',
      decisionCategory: 'operational',
      score: '0.8',
    });
    expect(candidate.status).toBe('proposed');
    expect(candidate.title).toBe('Launch product X');
    expect(candidate.score).toBe('0.8');
  });

  it('rankCandidates sorts by score descending and assigns positions', () => {
    const recommender = createRecommender();
    const candidates = [
      recommender.createCandidate({ organizationId: 'org-1', title: 'A', summary: 's', proposedAction: 'a', decisionCategory: 'operational', score: '0.3' }),
      recommender.createCandidate({ organizationId: 'org-1', title: 'B', summary: 's', proposedAction: 'a', decisionCategory: 'operational', score: '0.9' }),
    ];
    const ranked = recommender.rankCandidates(candidates);
    expect(ranked[0]!.title).toBe('B');
    expect(ranked[0]!.rank.position).toBe(1);
    expect(ranked[1]!.rank.position).toBe(2);
  });

  it('advances "proposed" candidates to "ranked" but leaves other statuses untouched', () => {
    const recommender = createRecommender();
    const proposed = recommender.createCandidate({ organizationId: 'org-1', title: 'A', summary: 's', proposedAction: 'a', decisionCategory: 'operational', score: '0.5' });
    const accepted = { ...recommender.createCandidate({ organizationId: 'org-1', title: 'B', summary: 's', proposedAction: 'a', decisionCategory: 'operational', score: '0.6' }), status: 'accepted' as const };

    const ranked = recommender.rankCandidates([proposed, accepted]);
    expect(ranked.find((c) => c.title === 'A')!.status).toBe('ranked');
    expect(ranked.find((c) => c.title === 'B')!.status).toBe('accepted');
  });

  it('sets totalCandidates consistently across all ranked items', () => {
    const recommender = createRecommender();
    const candidates = [
      recommender.createCandidate({ organizationId: 'org-1', title: 'A', summary: 's', proposedAction: 'a', decisionCategory: 'operational', score: '0.1' }),
      recommender.createCandidate({ organizationId: 'org-1', title: 'B', summary: 's', proposedAction: 'a', decisionCategory: 'operational', score: '0.2' }),
      recommender.createCandidate({ organizationId: 'org-1', title: 'C', summary: 's', proposedAction: 'a', decisionCategory: 'operational', score: '0.3' }),
    ];
    const ranked = recommender.rankCandidates(candidates);
    expect(ranked.every((c) => c.rank.totalCandidates === 3)).toBe(true);
  });
});
