/**
 * Real {@link IntelligenceQueries} implementation — a CQRS read layer
 * composed over the abstract repository ports.
 *
 * @module queries/intelligence-queries.impl
 */
import type { BusinessOpportunityRepository } from '../opportunities/repository.js';
import type { CompetitorRepository } from '../competitor-intelligence/repository.js';
import type { MachineOpportunityRepository } from '../machine-discovery/repository.js';
import type { MarketRepository } from '../market-research/repository.js';
import type { PriceAnalysisRepository } from '../pricing-intelligence/repository.js';
import type { PriceAnalysis } from '../pricing-intelligence/types.js';
import type { ProductOpportunityRepository } from '../product-discovery/repository.js';
import type { RecommendationCandidateRepository } from '../recommendation-engine/repository.js';
import type { TrendRepository } from '../trend-discovery/repository.js';
import type { CapabilityId, ProductId } from '../shared/identifiers.js';
import type { IntelligenceQueries } from './intelligence-queries.js';

export interface IntelligenceQueriesDeps {
  readonly trendRepository: TrendRepository;
  readonly productOpportunityRepository: ProductOpportunityRepository;
  readonly machineOpportunityRepository: MachineOpportunityRepository;
  readonly businessOpportunityRepository: BusinessOpportunityRepository;
  readonly competitorRepository: CompetitorRepository;
  readonly priceAnalysisRepository: PriceAnalysisRepository;
  readonly marketRepository: MarketRepository;
  readonly recommendationCandidateRepository: RecommendationCandidateRepository;
  /**
   * Trend/RecommendationCandidate entities don't carry capabilityId/productId
   * links in this package's contracts (that mapping lives in Business DNA /
   * Domain Graph). Callers that maintain such a mapping can supply it here;
   * otherwise the id lists in the corresponding results are empty rather
   * than fabricated.
   */
  readonly resolveCapabilityIdsForTrends?: (trendIds: readonly string[]) => readonly CapabilityId[];
  readonly resolveProductIdsForCandidates?: (candidateIds: readonly string[]) => readonly ProductId[];
  /**
   * PriceAnalysisRepository only declares findByProduct (no "list all") —
   * callers that need every analysis regardless of product can supply a
   * lookup here; otherwise an unscoped findPriceGaps returns none.
   */
  readonly listAllPriceAnalyses?: (organizationId: string) => Promise<readonly PriceAnalysis[]>;
}

/** Creates an {@link IntelligenceQueries} read port over the given repositories. */
export function createIntelligenceQueries(deps: IntelligenceQueriesDeps): IntelligenceQueries {
  return {
    async findTrendingProducts(query) {
      const [products, trends] = await Promise.all([
        deps.productOpportunityRepository.findByStatus(query.organizationId, 'evaluating'),
        deps.trendRepository.findByCategory(query.organizationId, 'product_demand'),
      ]);
      return { products, trends };
    },

    async findTrendingCapabilities(query) {
      const trends = await deps.trendRepository.findByCategory(query.organizationId, 'capability_demand');
      const capabilityIds = deps.resolveCapabilityIdsForTrends?.(trends.map((trend) => trend.id)) ?? [];
      return { capabilityIds, trends };
    },

    async findMachineOpportunities(query) {
      const opportunities = await deps.machineOpportunityRepository.findByStatus(query.organizationId, 'recommended');
      return { opportunities };
    },

    async findBusinessOpportunities(query) {
      const opportunities = await deps.businessOpportunityRepository.findByStatus(query.organizationId, 'qualified');
      return { opportunities };
    },

    async findCompetitorThreats(query) {
      const competitors = await deps.competitorRepository.findByStatus(query.organizationId, 'active');
      return { competitors: [...competitors].sort((a, b) => parseFloat(b.threatScore ?? '0') - parseFloat(a.threatScore ?? '0')) };
    },

    async findPriceGaps(organizationId, productId) {
      if (productId) {
        return { analyses: await deps.priceAnalysisRepository.findByProduct(organizationId, productId) };
      }
      const analyses = deps.listAllPriceAnalyses ? await deps.listAllPriceAnalyses(organizationId) : [];
      return { analyses };
    },

    async findMarketDemand(query) {
      const markets = await deps.marketRepository.findByStatus(query.organizationId, 'active');
      return { markets };
    },

    async findRecommendedProducts(query) {
      const recommendations = await deps.recommendationCandidateRepository.findByStatus(
        query.organizationId,
        'ranked',
      );
      const productIds = deps.resolveProductIdsForCandidates?.(recommendations.map((rec) => rec.id)) ?? [];
      return { recommendations, productIds };
    },
  };
}
