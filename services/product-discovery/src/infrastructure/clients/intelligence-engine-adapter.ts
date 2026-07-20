import { randomUUID } from 'node:crypto';
import type {
  ProductOpportunity,
  RecommendationCandidate,
} from '@lateen-os/intelligence-engine';
import type { OrganizationId, ProductOpportunityId } from '../../domain/identifiers.js';
import type { RankedOpportunity } from '../../domain/ranked-opportunity.js';
import type { IntelligenceEnginePort } from '../../ports/outbound/intelligence-engine-port.js';
import type { CacheStore } from '../cache/redis-cache.js';

const emptyTrendingProducts = { products: [], trends: [] };
const emptyTrendingCapabilities = { capabilityIds: [], trends: [] };
const emptyCompetitors = { competitors: [] };
const emptyPriceGaps = { analyses: [] };
const emptyMarketDemand = { markets: [] };
const emptyRecommendedProducts = { recommendations: [], productIds: [] };
const emptyBusinessOpportunities = { opportunities: [] };
const emptyMachineOpportunities = { opportunities: [] };

/**
 * Platform Intelligence Engine adapter using @lateen-os/intelligence-engine types.
 * Persists opportunities and candidates in Redis.
 */
export function createIntelligenceEngineAdapter(cache: CacheStore): IntelligenceEnginePort {
  const opportunityKey = (organizationId: OrganizationId, id: string) =>
    `intelligence:opportunity:${organizationId}:${id}`;
  const candidateKey = (organizationId: OrganizationId, id: string) =>
    `intelligence:candidate:${organizationId}:${id}`;

  return {
    async mapToProductOpportunity(organizationId: OrganizationId, opportunity: RankedOpportunity) {
      const now = new Date().toISOString();
      const mapped: ProductOpportunity = {
        id: randomUUID() as ProductOpportunityId,
        organizationId,
        title: opportunity.title,
        description: opportunity.description ?? 'Mapped product opportunity',
        ideas: [
          {
            ideaId: randomUUID() as ProductOpportunity['ideas'][number]['ideaId'],
            title: opportunity.title,
            description: opportunity.description,
          },
        ],
        score: {
          demand: opportunity.demandScore,
          profit: opportunity.compositeScore,
          complexity: '0.35',
          overall: opportunity.compositeScore,
        },
        requiredCapabilities: [],
        status: 'identified',
        createdAt: now,
        updatedAt: now,
      };
      await cache.set(opportunityKey(organizationId, mapped.id as string), mapped);
      return mapped;
    },

    async createRecommendationCandidate(organizationId: OrganizationId, opportunity: ProductOpportunity) {
      const now = new Date().toISOString();
      const candidate: RecommendationCandidate = {
        id: randomUUID() as RecommendationCandidate['id'],
        organizationId,
        title: opportunity.title,
        summary: opportunity.description ?? 'Recommendation candidate',
        proposedAction: `Manufacture ${opportunity.title} using existing capabilities`,
        decisionCategory: 'strategic',
        rank: { position: 1, totalCandidates: 1, percentile: '95' },
        score: opportunity.score.overall,
        reasons: [{ code: 'DEMAND', summary: 'Strong normalized signal demand score' }],
        status: 'submitted_to_decision_engine',
        createdAt: now,
        updatedAt: now,
      };
      await cache.set(candidateKey(organizationId, candidate.id as string), candidate);
      return candidate;
    },

    async getProductOpportunity(organizationId: OrganizationId, opportunityId: ProductOpportunityId) {
      return cache.get<ProductOpportunity>(opportunityKey(organizationId, opportunityId as string));
    },

    async findTrendingProducts() {
      return emptyTrendingProducts;
    },
    async findTrendingCapabilities() {
      return emptyTrendingCapabilities;
    },
    async findMachineOpportunities() {
      return emptyMachineOpportunities;
    },
    async findBusinessOpportunities() {
      return emptyBusinessOpportunities;
    },
    async findCompetitorThreats() {
      return emptyCompetitors;
    },
    async findPriceGaps() {
      return emptyPriceGaps;
    },
    async findMarketDemand() {
      return emptyMarketDemand;
    },
    async findRecommendedProducts() {
      return emptyRecommendedProducts;
    },
  } as IntelligenceEnginePort;
}
