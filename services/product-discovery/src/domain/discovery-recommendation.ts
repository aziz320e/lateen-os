/** @module domain/discovery-recommendation */
import type { RecommendationCandidate } from '@lateen-os/intelligence-engine';
import type {
  DiscoveryRecommendationId,
  OrganizationId,
  ProductOpportunityId,
  RankedOpportunityId,
} from './identifiers.js';
import type { TenantAuditableEntity } from './entity.js';
import type { ProfitEstimate } from './profit-estimate.js';
import type { CapabilityMatch } from './capability-match.js';

export type DiscoveryRecommendationStatus =
  | 'draft'
  | 'ready'
  | 'submitted'
  | 'approved'
  | 'rejected';

/** Final service output — manufacturable product recommendation. */
export interface DiscoveryRecommendation extends TenantAuditableEntity<DiscoveryRecommendationId> {
  readonly opportunityId: RankedOpportunityId;
  readonly productOpportunityId?: ProductOpportunityId;
  readonly capabilityMatch: CapabilityMatch;
  readonly profitEstimate: ProfitEstimate;
  readonly recommendationCandidate: RecommendationCandidate;
  readonly status: DiscoveryRecommendationStatus;
  readonly rationale: string;
}

export interface RecommendationResult {
  readonly recommendations: readonly DiscoveryRecommendation[];
}

export type { OrganizationId };
