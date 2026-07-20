/** @module queries/types */
import type { BusinessOpportunity } from '../opportunities/types.js';
import type { Competitor } from '../competitor-intelligence/types.js';
import type { MachineOpportunity } from '../machine-discovery/types.js';
import type { Market } from '../market-research/types.js';
import type { PriceAnalysis } from '../pricing-intelligence/types.js';
import type { ProductOpportunity } from '../product-discovery/types.js';
import type { RecommendationCandidate } from '../recommendation-engine/types.js';
import type { CapabilityId, ProductId } from '../shared/identifiers.js';
import type { Trend } from '../trend-discovery/types.js';

export interface TrendingProductsResult {
  readonly products: readonly ProductOpportunity[];
  readonly trends: readonly Trend[];
}

export interface TrendingCapabilitiesResult {
  readonly capabilityIds: readonly CapabilityId[];
  readonly trends: readonly Trend[];
}

export interface CompetitorThreatsResult {
  readonly competitors: readonly Competitor[];
}

export interface PriceGapsResult {
  readonly analyses: readonly PriceAnalysis[];
}

export interface MarketDemandResult {
  readonly markets: readonly Market[];
}

export interface RecommendedProductsResult {
  readonly recommendations: readonly RecommendationCandidate[];
  readonly productIds: readonly ProductId[];
}

export interface BusinessOpportunitiesResult {
  readonly opportunities: readonly BusinessOpportunity[];
}

export interface MachineOpportunitiesResult {
  readonly opportunities: readonly MachineOpportunity[];
}
