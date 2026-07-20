import { randomUUID } from 'node:crypto';
import type { CollectSignalsStage } from '../stages/collect-signals-stage.js';
import type { NormalizeStage } from '../stages/normalize-stage.js';
import type { RankStage } from '../stages/rank-stage.js';
import type { CapabilityMatchingStage } from '../stages/capability-matching-stage.js';
import type { ProfitEstimationStage } from '../stages/profit-estimation-stage.js';
import type { DecisionSubmissionStage } from '../stages/decision-submission-stage.js';
import type { RecommendationStage } from '../stages/recommendation-stage.js';
import type {
  CapabilityMatchingStageInput,
  CollectSignalsStageInput,
  DecisionSubmissionStageInput,
  NormalizeStageInput,
  ProfitEstimationStageInput,
  RankStageInput,
  RecommendationStageInput,
} from '../types.js';
import type { SignalAggregatorPort } from '../../ports/outbound/signal-source-port.js';
import type { CapabilityEnginePort } from '../../ports/outbound/capability-engine-port.js';
import type { BusinessDnaPort } from '../../ports/outbound/business-dna-port.js';
import type { IntelligenceEnginePort } from '../../ports/outbound/intelligence-engine-port.js';
import type { DecisionEnginePort } from '../../ports/outbound/decision-engine-port.js';
import type {
  CapabilityId,
  CapabilityMatchId,
  DecisionId,
  NormalizedSignalId,
  ProfitEstimateId,
  RankedOpportunityId,
} from '../../domain/identifiers.js';
import type { NormalizedSignal } from '../../domain/normalized-signal.js';
import type { RankedOpportunity } from '../../domain/ranked-opportunity.js';
import type { CapabilityMatch } from '../../domain/capability-match.js';
import type { ProfitEstimate } from '../../domain/profit-estimate.js';
import type { DecisionSubmission } from '../../domain/decision-submission.js';
import type { DiscoveryRecommendation } from '../../domain/discovery-recommendation.js';

export function createCollectSignalsStage(aggregator: SignalAggregatorPort): CollectSignalsStage {
  return {
    async execute(input: CollectSignalsStageInput) {
      const result = await aggregator.collectFromAllSources({
        organizationId: input.organizationId,
        keywords: input.keywords,
        limit: 4,
      });
      return {
        result: {
          ...result,
          runId: input.runId as string,
        },
      };
    },
  };
}

export function createNormalizeStage(): NormalizeStage {
  return {
    async execute(input: NormalizeStageInput) {
      const grouped = new Map<string, NormalizedSignal>();

      for (const signal of input.collectSignals.signals) {
        const concept = signal.keyword ?? signal.title;
        const key = concept.toLowerCase();
        const existing = grouped.get(key);
        const demandScore = signal.strength ?? '0.60';

        if (existing) {
          grouped.set(key, {
            ...existing,
            sourceSignalIds: [...existing.sourceSignalIds, signal.signalId],
            demandScore: (
              (parseFloat(existing.demandScore) + parseFloat(demandScore)) /
              2
            ).toFixed(2),
            confidence: Math.min(parseFloat(existing.confidence) + 0.05, 0.95).toFixed(2),
          });
          continue;
        }

        grouped.set(key, {
          normalizedSignalId: randomUUID() as NormalizedSignalId,
          organizationId: input.organizationId,
          sourceSignalIds: [signal.signalId],
          primarySource: signal.source,
          category: signal.category,
          productConcept: concept,
          keywords: [concept],
          demandScore,
          confidence: '0.70',
        });
      }

      return { result: { signals: [...grouped.values()] } };
    },
  };
}

export function createRankStage(): RankStage {
  return {
    async execute(input: RankStageInput) {
      const opportunities: RankedOpportunity[] = input.normalize.signals
        .map((signal, index) => {
          const demand = parseFloat(signal.demandScore);
          const trend = parseFloat(signal.confidence);
          const marketFit = (demand + trend) / 2;
          const composite = (demand * 0.5 + trend * 0.3 + marketFit * 0.2).toFixed(2);
          const tier: RankedOpportunity['tier'] =
            demand >= 0.8 ? 'top' : demand >= 0.7 ? 'high' : demand >= 0.6 ? 'medium' : 'low';

          return {
            opportunityId: randomUUID() as RankedOpportunityId,
            organizationId: input.organizationId,
            normalizedSignalIds: [signal.normalizedSignalId],
            title: signal.productConcept,
            description: `Manufacturable opportunity from ${signal.primarySource}`,
            rank: index + 1,
            tier,
            compositeScore: composite,
            demandScore: signal.demandScore,
            trendScore: signal.confidence,
            marketFitScore: marketFit.toFixed(2),
          };
        })
        .sort((a, b) => parseFloat(b.compositeScore) - parseFloat(a.compositeScore))
        .map((opportunity, index) => ({ ...opportunity, rank: index + 1 }));

      return { result: { opportunities } };
    },
  };
}

export function createCapabilityMatchingStage(
  capabilityEngine: CapabilityEnginePort,
  businessDna: BusinessDnaPort,
): CapabilityMatchingStage {
  return {
    async execute(input: CapabilityMatchingStageInput) {
      const catalog = await businessDna.loadCatalog(input.organizationId);
      const catalogSize =
        catalog.products.length +
        catalog.machines.length +
        catalog.projects.length +
        catalog.customers.length +
        catalog.branches.length +
        catalog.departments.length +
        catalog.agents.length;

      const capabilities = await capabilityEngine.listCapabilities(input.organizationId);
      const catalogBoost = catalogSize > 0 ? Math.min(catalogSize / 20, 0.15) : 0;
      const matches: CapabilityMatch[] = [];

      for (const opportunity of input.rank.opportunities) {
        const matched = capabilities.slice(0, 3).map((capability, index) => ({
          capabilityId: capability.id as CapabilityId,
          label: capability.name,
          available: capability.status === 'active',
          matchScore: Math.min(0.95, 0.9 - index * 0.1 + catalogBoost).toFixed(2),
        }));

        const overall = matched.length
          ? (
              matched.reduce((sum, item) => sum + parseFloat(item.matchScore), 0) /
              matched.length
            ).toFixed(2)
          : '0.50';

        matches.push({
          matchId: randomUUID() as CapabilityMatchId,
          organizationId: input.organizationId,
          opportunityId: opportunity.opportunityId,
          status: parseFloat(overall) >= 0.75 ? 'full' : parseFloat(overall) >= 0.5 ? 'partial' : 'gap',
          matchedCapabilities: matched,
          missingCapabilities: [],
          overallMatchScore: overall,
          manufacturable: parseFloat(overall) >= 0.5,
        });
      }

      return { result: { matches: matches.filter((match) => match.manufacturable) } };
    },
  };
}

export function createProfitEstimationStage(): ProfitEstimationStage {
  return {
    async execute(input: ProfitEstimationStageInput) {
      const estimates: ProfitEstimate[] = input.capabilityMatching.matches.map((match) => {
        const score = parseFloat(match.overallMatchScore);
        const unitCost = (120 - score * 20).toFixed(2);
        const unitPrice = (180 + score * 40).toFixed(2);
        const margin = (((parseFloat(unitPrice) - parseFloat(unitCost)) / parseFloat(unitPrice)) * 100).toFixed(2);

        return {
          estimateId: randomUUID() as ProfitEstimateId,
          organizationId: input.organizationId,
          opportunityId: match.opportunityId,
          capabilityMatchId: match.matchId,
          currency: 'SAR',
          estimatedUnitCost: unitCost,
          estimatedUnitPrice: unitPrice,
          estimatedMarginPercent: margin,
          estimatedMonthlyVolume: Math.round(50 + score * 100).toString(),
          projectedMonthlyProfit: ((parseFloat(unitPrice) - parseFloat(unitCost)) * (50 + score * 100)).toFixed(2),
          confidence: score >= 0.8 ? 'high' : score >= 0.6 ? 'medium' : 'low',
        };
      });

      return { result: { estimates } };
    },
  };
}

export function createDecisionSubmissionStage(
  intelligenceEngine: IntelligenceEnginePort,
  decisionEngine: DecisionEnginePort,
): DecisionSubmissionStage {
  return {
    async execute(input: DecisionSubmissionStageInput) {
      const topEstimate = input.profitEstimation.estimates[0];
      if (!topEstimate) {
        throw new Error('No profit estimates available for decision submission');
      }

      const rankedOpportunity = {
        opportunityId: topEstimate.opportunityId,
        organizationId: input.organizationId,
        normalizedSignalIds: [],
        title: 'Top discovery opportunity',
        rank: 1,
        tier: 'top' as const,
        compositeScore: '0.85',
        demandScore: '0.85',
        trendScore: '0.80',
        marketFitScore: '0.82',
      };

      const productOpportunity = await intelligenceEngine.mapToProductOpportunity(
        input.organizationId,
        rankedOpportunity,
      );
      const candidate = await intelligenceEngine.createRecommendationCandidate(
        input.organizationId,
        productOpportunity,
      );

      const submission: DecisionSubmission = {
        organizationId: input.organizationId,
        decisionId: randomUUID() as DecisionId,
        recommendationCandidateId: candidate.id,
        profitEstimateIds: input.profitEstimation.estimates.map((estimate) => estimate.estimateId),
        decisionCategory: 'strategic',
        title: candidate.title,
        summary: candidate.summary,
        proposedAction: candidate.proposedAction,
        status: 'prepared',
      };

      const decision = await decisionEngine.submitForDecision(input.organizationId, {
        ...submission,
        status: 'submitted',
      });

      return {
        result: {
          submission: {
            ...submission,
            decisionId: decision.id,
            status: 'submitted',
          },
        },
      };
    },
  };
}

export function createRecommendationStage(
  intelligenceEngine: IntelligenceEnginePort,
): RecommendationStage {
  return {
    async execute(input: RecommendationStageInput) {
      const recommendations: DiscoveryRecommendation[] = [];

      for (const match of input.capabilityMatching.matches) {
        const estimate = input.profitEstimation.estimates.find(
          (item) => item.opportunityId === match.opportunityId,
        );
        if (!estimate) continue;

        const rankedOpportunity = {
          opportunityId: match.opportunityId,
          organizationId: input.organizationId,
          normalizedSignalIds: [],
          title: `Opportunity ${match.opportunityId as string}`.slice(0, 32),
          rank: 1,
          tier: 'high' as const,
          compositeScore: match.overallMatchScore,
          demandScore: match.overallMatchScore,
          trendScore: '0.75',
          marketFitScore: match.overallMatchScore,
        };

        const productOpportunity = await intelligenceEngine.mapToProductOpportunity(
          input.organizationId,
          rankedOpportunity,
        );
        const candidate = await intelligenceEngine.createRecommendationCandidate(
          input.organizationId,
          productOpportunity,
        );

        const now = new Date().toISOString();
        recommendations.push({
          id: randomUUID() as DiscoveryRecommendation['id'],
          organizationId: input.organizationId,
          opportunityId: match.opportunityId,
          productOpportunityId: productOpportunity.id,
          capabilityMatch: match,
          profitEstimate: estimate,
          recommendationCandidate: candidate,
          status: 'ready',
          rationale: `Manufacturable with ${match.matchedCapabilities.length} matched capabilities`,
          createdAt: now,
          updatedAt: now,
        });
      }

      return { result: { recommendations } };
    },
  };
}
