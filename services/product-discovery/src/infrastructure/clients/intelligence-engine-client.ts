import { randomUUID } from 'node:crypto';
import type {
  ProductOpportunity,
  RecommendationCandidate,
} from '@lateen-os/intelligence-engine';
import type { OrganizationId, ProductOpportunityId } from '../../domain/identifiers.js';
import type { RankedOpportunity } from '../../domain/ranked-opportunity.js';
import type { IntelligenceEnginePort } from '../../ports/outbound/intelligence-engine-port.js';

const emptyTrendingProducts = { products: [], trends: [] };
const emptyTrendingCapabilities = { capabilityIds: [], trends: [] };
const emptyCompetitors = { competitors: [] };
const emptyPriceGaps = { analyses: [] };
const emptyMarketDemand = { markets: [] };
const emptyRecommendedProducts = { recommendations: [], productIds: [] };
const emptyBusinessOpportunities = { opportunities: [] };
const emptyMachineOpportunities = { opportunities: [] };

export function createInMemoryIntelligenceEngineClient(): IntelligenceEnginePort {
  const opportunities = new Map<string, ProductOpportunity>();

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
      opportunities.set(`${organizationId}:${mapped.id as string}`, mapped);
      return mapped;
    },
    async createRecommendationCandidate(organizationId: OrganizationId, opportunity: ProductOpportunity) {
      const now = new Date().toISOString();
      return {
        id: randomUUID() as RecommendationCandidate['id'],
        organizationId,
        title: opportunity.title,
        summary: opportunity.description ?? 'Recommendation candidate',
        proposedAction: `Manufacture ${opportunity.title} using existing capabilities`,
        decisionCategory: 'strategic',
        rank: { position: 1, totalCandidates: 1, percentile: '95' },
        score: opportunity.score.overall,
        reasons: [{ code: 'DEMAND', summary: 'Strong normalized signal demand score' }],
        status: 'proposed',
        createdAt: now,
        updatedAt: now,
      };
    },
    async getProductOpportunity(organizationId: OrganizationId, opportunityId: ProductOpportunityId) {
      return opportunities.get(`${organizationId}:${opportunityId as string}`) ?? null;
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
