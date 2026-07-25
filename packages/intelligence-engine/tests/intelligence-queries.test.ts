import { describe, expect, it } from 'vitest';
import { createIntelligenceQueries } from '../src/queries/intelligence-queries.impl.js';
import { createTrendRepository } from '../src/trend-discovery/repository.impl.js';
import { createProductOpportunityRepository } from '../src/product-discovery/repository.impl.js';
import { createMachineOpportunityRepository } from '../src/machine-discovery/repository.impl.js';
import { createBusinessOpportunityRepository } from '../src/opportunities/repository.impl.js';
import { createCompetitorRepository } from '../src/competitor-intelligence/repository.impl.js';
import { createPriceAnalysisRepository } from '../src/pricing-intelligence/repository.impl.js';
import { createMarketRepository } from '../src/market-research/repository.impl.js';
import { createRecommendationCandidateRepository } from '../src/recommendation-engine/repository.impl.js';
import type { Trend } from '../src/trend-discovery/types.js';
import type { Competitor } from '../src/competitor-intelligence/types.js';
import type { PriceAnalysis } from '../src/pricing-intelligence/types.js';

const ORG = 'org-1';
const now = new Date().toISOString();

function buildQueries(seed: { trends?: readonly Trend[]; competitors?: readonly Competitor[]; priceAnalyses?: readonly PriceAnalysis[] } = {}) {
  return createIntelligenceQueries({
    trendRepository: createTrendRepository(seed.trends),
    productOpportunityRepository: createProductOpportunityRepository(),
    machineOpportunityRepository: createMachineOpportunityRepository(),
    businessOpportunityRepository: createBusinessOpportunityRepository(),
    competitorRepository: createCompetitorRepository(seed.competitors),
    priceAnalysisRepository: createPriceAnalysisRepository(seed.priceAnalyses),
    marketRepository: createMarketRepository(),
    recommendationCandidateRepository: createRecommendationCandidateRepository(),
  });
}

describe('createIntelligenceQueries', () => {
  it('findTrendingProducts returns product_demand trends', async () => {
    const trend: Trend = {
      id: 't1', organizationId: ORG, createdAt: now, updatedAt: now,
      title: 'Rising', category: 'product_demand',
      score: { value: '0.8', direction: 'rising', computedAt: now },
      source: 'sales_data', signals: [], status: 'active',
    };
    const queries = buildQueries({ trends: [trend] });
    const result = await queries.findTrendingProducts({ organizationId: ORG });
    expect(result.trends).toHaveLength(1);
  });

  it('findCompetitorThreats sorts by threatScore descending', async () => {
    const low: Competitor = { id: 'c1', organizationId: ORG, createdAt: now, updatedAt: now, name: 'Low', products: [], prices: [], capabilities: [], threatScore: '0.2', status: 'active' };
    const high: Competitor = { id: 'c2', organizationId: ORG, createdAt: now, updatedAt: now, name: 'High', products: [], prices: [], capabilities: [], threatScore: '0.9', status: 'active' };
    const queries = buildQueries({ competitors: [low, high] });
    const result = await queries.findCompetitorThreats({ organizationId: ORG });
    expect(result.competitors.map((c) => c.name)).toEqual(['High', 'Low']);
  });

  it('findPriceGaps with a productId uses findByProduct', async () => {
    const analysis: PriceAnalysis = {
      id: 'pa1', organizationId: ORG, createdAt: now, updatedAt: now, productId: 'p1',
      marginAnalysis: { currentMargin: '0.2', targetMargin: '0.3', gap: '0.1' },
      competitivePrices: [], targetPrice: { recommended: '10', floor: '8', ceiling: '12', currency: 'USD' },
      status: 'active',
    };
    const queries = buildQueries({ priceAnalyses: [analysis] });
    const result = await queries.findPriceGaps(ORG, 'p1');
    expect(result.analyses).toHaveLength(1);
  });

  it('findPriceGaps with no productId returns empty when no listAllPriceAnalyses lookup is injected', async () => {
    const queries = buildQueries();
    const result = await queries.findPriceGaps(ORG);
    expect(result.analyses).toEqual([]);
  });

  it('findTrendingCapabilities returns empty capabilityIds when no resolver is injected', async () => {
    const queries = buildQueries();
    const result = await queries.findTrendingCapabilities({ organizationId: ORG });
    expect(result.capabilityIds).toEqual([]);
  });
});
