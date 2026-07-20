/** @module domain/ranked-opportunity */
import type { NormalizedSignalId, OrganizationId, RankedOpportunityId } from './identifiers.js';
import type { ScoreValue } from './primitives.js';

export type OpportunityRankTier = 'top' | 'high' | 'medium' | 'low';

/** Ranked manufacturing opportunity derived from normalized signals. */
export interface RankedOpportunity {
  readonly opportunityId: RankedOpportunityId;
  readonly organizationId: OrganizationId;
  readonly normalizedSignalIds: readonly NormalizedSignalId[];
  readonly title: string;
  readonly description?: string;
  readonly rank: number;
  readonly tier: OpportunityRankTier;
  readonly compositeScore: ScoreValue;
  readonly demandScore: ScoreValue;
  readonly trendScore: ScoreValue;
  readonly marketFitScore: ScoreValue;
}

export interface RankOpportunitiesResult {
  readonly opportunities: readonly RankedOpportunity[];
}
