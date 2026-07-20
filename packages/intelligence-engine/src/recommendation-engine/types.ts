/** @module recommendation-engine/types */
import type { DecisionCategory } from '@lateen-os/decision-engine';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { OrganizationId, RecommendationCandidateId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type { RecommendationCandidateId };

export type RecommendationCandidateStatus =
  | 'proposed'
  | 'ranked'
  | 'submitted_to_decision_engine'
  | 'accepted'
  | 'rejected'
  | 'archived';

export interface RecommendationRank {
  readonly position: number;
  readonly totalCandidates: number;
  readonly percentile?: ScoreValue;
}

export interface RecommendationReason {
  readonly code: string;
  readonly summary: string;
  readonly supportingSignalIds?: readonly string[];
}

/**
 * Intelligence-produced recommendation candidate.
 * Consumed by Decision Engine — does not execute decisions.
 */
export interface RecommendationCandidate extends TenantAuditableEntity<RecommendationCandidateId> {
  readonly title: string;
  readonly summary: string;
  readonly proposedAction: string;
  readonly decisionCategory: DecisionCategory;
  readonly rank: RecommendationRank;
  readonly score: ScoreValue;
  readonly reasons: readonly RecommendationReason[];
  readonly status: RecommendationCandidateStatus;
}

export type { OrganizationId };
