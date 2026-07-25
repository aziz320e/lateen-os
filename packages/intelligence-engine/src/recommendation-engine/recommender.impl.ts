/**
 * Real recommendation-candidate builder — combines a score with
 * ranking-among-peers into a {@link RecommendationCandidate} the Decision
 * Engine can consume. This package only proposes; it never decides.
 *
 * @module recommendation-engine/recommender.impl
 */
import { randomUUID } from 'node:crypto';
import type { DecisionCategory } from '@lateen-os/decision-engine';
import type { OrganizationId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';
import type { RecommendationCandidate, RecommendationReason } from './types.js';

export interface CreateCandidateInput {
  readonly organizationId: OrganizationId;
  readonly title: string;
  readonly summary: string;
  readonly proposedAction: string;
  readonly decisionCategory: DecisionCategory;
  readonly score: ScoreValue;
  readonly reasons?: readonly RecommendationReason[];
}

export interface Recommender {
  /** Builds an unranked candidate (status "proposed", rank position 0 of 0). */
  createCandidate(input: CreateCandidateInput): RecommendationCandidate;
  /** Ranks a batch of candidates by score, descending, and advances "proposed" candidates to "ranked". */
  rankCandidates(candidates: readonly RecommendationCandidate[]): readonly RecommendationCandidate[];
}

/** Creates a {@link Recommender}. */
export function createRecommender(): Recommender {
  return {
    createCandidate(input) {
      const now = new Date().toISOString();
      return {
        id: randomUUID(),
        organizationId: input.organizationId,
        createdAt: now,
        updatedAt: now,
        title: input.title,
        summary: input.summary,
        proposedAction: input.proposedAction,
        decisionCategory: input.decisionCategory,
        rank: { position: 0, totalCandidates: 0 },
        score: input.score,
        reasons: input.reasons ?? [],
        status: 'proposed',
      };
    },

    rankCandidates(candidates) {
      const sorted = [...candidates].sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
      return sorted.map((candidate, index) => ({
        ...candidate,
        rank: {
          position: index + 1,
          totalCandidates: sorted.length,
          percentile: (((sorted.length - index) / sorted.length) * 100).toFixed(1),
        },
        status: candidate.status === 'proposed' ? 'ranked' : candidate.status,
      }));
    },
  };
}
