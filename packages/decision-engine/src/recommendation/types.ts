/** @module recommendation/types */
import type { ConfidenceScore } from '@lateen-os/institutional-memory';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { DecisionId, OrganizationId, RecommendationId } from '../shared/identifiers.js';

export type { RecommendationId };

export type RecommendationStatus = 'proposed' | 'accepted' | 'rejected' | 'superseded';

/** Numeric recommendation score as decimal string. */
export type RecommendationScoreValue = string;

/** Score ranking a recommendation option. */
export interface RecommendationScore {
  readonly value: RecommendationScoreValue;
  readonly confidence: ConfidenceScore;
  readonly rationale?: string;
}

/** Alternative option considered for a decision. */
export interface Alternative {
  readonly code: string;
  readonly title: string;
  readonly description?: string;
  readonly score?: RecommendationScore;
}

/**
 * Recommendation submitted for decision evaluation.
 * AI agents produce recommendations — the Decision Engine decides.
 */
export interface Recommendation extends TenantAuditableEntity<RecommendationId> {
  readonly decisionId: DecisionId;
  readonly title: string;
  readonly summary: string;
  readonly proposedAction: string;
  readonly score: RecommendationScore;
  readonly alternatives: readonly Alternative[];
  readonly status: RecommendationStatus;
}

export type { OrganizationId };
