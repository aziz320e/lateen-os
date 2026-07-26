/**
 * IntelligenceEngine facade — composes `@lateen-os/intelligence-engine`'s
 * real scorer, ranker, forecaster, recommender, and query layer over its
 * in-memory repositories. Repositories are constructed and wired here
 * only; they are never exposed on the returned facade.
 *
 * @module system/intelligence-engine
 */
import {
  createBusinessOpportunityRepository,
  createCompetitorRepository,
  createForecaster,
  createIntelligenceQueries,
  createMachineOpportunityRepository,
  createMarketRepository,
  createPriceAnalysisRepository,
  createProductOpportunityRepository,
  createRanker,
  createRecommendationCandidateRepository,
  createRecommender,
  createScorer,
  createTrendRepository,
} from '@lateen-os/intelligence-engine';
import type {
  Forecaster,
  IntelligenceQueries,
  Ranker,
  Recommender,
  Scorer,
} from '@lateen-os/intelligence-engine';

/** Public intelligence facade — real scoring/ranking/forecasting/recommendation plus a read-only query layer. No repositories exposed. */
export interface IntelligenceEngine {
  readonly scorer: Scorer;
  readonly ranker: Ranker;
  readonly forecaster: Forecaster;
  readonly recommender: Recommender;
  readonly queries: IntelligenceQueries;
}

/** Creates an {@link IntelligenceEngine} over fresh in-memory repositories. */
export function createIntelligenceEngineFacade(): IntelligenceEngine {
  const trendRepository = createTrendRepository();
  const productOpportunityRepository = createProductOpportunityRepository();
  const machineOpportunityRepository = createMachineOpportunityRepository();
  const businessOpportunityRepository = createBusinessOpportunityRepository();
  const competitorRepository = createCompetitorRepository();
  const priceAnalysisRepository = createPriceAnalysisRepository();
  const marketRepository = createMarketRepository();
  const recommendationCandidateRepository = createRecommendationCandidateRepository();

  return {
    scorer: createScorer(),
    ranker: createRanker(),
    forecaster: createForecaster(),
    recommender: createRecommender(),
    queries: createIntelligenceQueries({
      trendRepository,
      productOpportunityRepository,
      machineOpportunityRepository,
      businessOpportunityRepository,
      competitorRepository,
      priceAnalysisRepository,
      marketRepository,
      recommendationCandidateRepository,
    }),
  };
}
