/** @module ports/outbound/intelligence-engine-port */
import type {
  IntelligenceQueries,
  ProductOpportunity,
  RecommendationCandidate,
} from '@lateen-os/intelligence-engine';
import type { OrganizationId, ProductOpportunityId } from '../../domain/identifiers.js';
import type { RankedOpportunity } from '../../domain/ranked-opportunity.js';

/** Outbound port to Intelligence Engine — scoring and recommendation candidates. */
export interface IntelligenceEnginePort extends IntelligenceQueries {
  mapToProductOpportunity(
    organizationId: OrganizationId,
    opportunity: RankedOpportunity,
  ): Promise<ProductOpportunity>;

  createRecommendationCandidate(
    organizationId: OrganizationId,
    opportunity: ProductOpportunity,
  ): Promise<RecommendationCandidate>;

  getProductOpportunity(
    organizationId: OrganizationId,
    opportunityId: ProductOpportunityId,
  ): Promise<ProductOpportunity | null>;
}
