/** @module queries/intelligence-queries */
import type { OrganizationId, ProductId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type {
  BusinessOpportunitiesResult,
  CompetitorThreatsResult,
  MachineOpportunitiesResult,
  MarketDemandResult,
  PriceGapsResult,
  RecommendedProductsResult,
  TrendingCapabilitiesResult,
  TrendingProductsResult,
} from './types.js';

/** Read-side query port for intelligence discovery and analysis. */
export interface IntelligenceQueries {
  findTrendingProducts(query: OrganizationScopedQuery): Promise<TrendingProductsResult>;

  findTrendingCapabilities(query: OrganizationScopedQuery): Promise<TrendingCapabilitiesResult>;

  findMachineOpportunities(query: OrganizationScopedQuery): Promise<MachineOpportunitiesResult>;

  findBusinessOpportunities(query: OrganizationScopedQuery): Promise<BusinessOpportunitiesResult>;

  findCompetitorThreats(query: OrganizationScopedQuery): Promise<CompetitorThreatsResult>;

  findPriceGaps(
    organizationId: OrganizationId,
    productId?: ProductId,
  ): Promise<PriceGapsResult>;

  findMarketDemand(query: OrganizationScopedQuery): Promise<MarketDemandResult>;

  findRecommendedProducts(query: OrganizationScopedQuery): Promise<RecommendedProductsResult>;
}
