/**
 * @lateen-os/intelligence-engine — Intelligence Engine
 *
 * Discovers opportunities, analyzes markets, detects trends, forecasts demand,
 * and generates recommendations. Produces intelligence only — does not execute decisions.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';

export * as trendDiscovery from './trend-discovery/index.js';
export * as marketResearch from './market-research/index.js';
export * as competitorIntelligence from './competitor-intelligence/index.js';
export * as productDiscovery from './product-discovery/index.js';
export * as machineDiscovery from './machine-discovery/index.js';
export * as pricingIntelligence from './pricing-intelligence/index.js';
export * as customerInsights from './customer-insights/index.js';
export * as knowledgeMining from './knowledge-mining/index.js';
export * as forecasting from './forecasting/index.js';
export * as recommendationEngine from './recommendation-engine/index.js';
export * as scoring from './scoring/index.js';
export * as ranking from './ranking/index.js';
export * as signals from './signals/index.js';
export * as opportunities from './opportunities/index.js';
export * as queries from './queries/index.js';

export type {
  Trend,
  TrendSignal,
  TrendSource,
  TrendScore,
  TrendCategory,
} from './trend-discovery/types.js';
export type {
  Market,
  MarketSegment,
  Demand,
  Supply,
  Opportunity,
} from './market-research/types.js';
export type {
  Competitor,
  CompetitorProduct,
  CompetitorPrice,
  CompetitorCapability,
} from './competitor-intelligence/types.js';
export type {
  ProductOpportunity,
  ProductIdea,
  ProductScore,
  RequiredCapability,
} from './product-discovery/types.js';
export type {
  MachineOpportunity,
  MachineRecommendation,
  ROI,
  PaybackPeriod,
} from './machine-discovery/types.js';
export type {
  PriceAnalysis,
  MarginAnalysis,
  CompetitivePrice,
  TargetPrice,
} from './pricing-intelligence/types.js';
export type {
  CustomerInsight,
  CustomerSegment,
  BuyingPattern,
} from './customer-insights/types.js';
export type {
  KnowledgeFinding,
  FindingEvidence,
  FindingScore,
} from './knowledge-mining/types.js';
export type {
  Forecast,
  ForecastModel,
  ForecastConfidence,
  ForecastPeriod,
} from './forecasting/types.js';
export type {
  RecommendationCandidate,
  RecommendationRank,
  RecommendationReason,
} from './recommendation-engine/types.js';
export type {
  IntelligenceScore,
  DemandScore,
  ScoringTrendScore,
  ProfitScore,
  ComplexityScore,
  RiskScore,
  ROIScore,
} from './scoring/types.js';
export type { RankingStrategy, RankingResult } from './ranking/types.js';
export type { Signal, SignalType, SignalStrength } from './signals/types.js';
export type {
  BusinessOpportunity,
  OpportunityScore,
  OpportunityCategory,
} from './opportunities/types.js';

export type { IntelligenceQueries } from './queries/intelligence-queries.js';
export {
  createIntelligenceQueries,
  type IntelligenceQueriesDeps,
} from './queries/intelligence-queries.impl.js';
export type { OrganizationId } from './shared/identifiers.js';

export type { TrendRepository } from './trend-discovery/repository.js';
export { createTrendRepository } from './trend-discovery/repository.impl.js';
export type { MarketRepository } from './market-research/repository.js';
export { createMarketRepository } from './market-research/repository.impl.js';
export type { CompetitorRepository } from './competitor-intelligence/repository.js';
export { createCompetitorRepository } from './competitor-intelligence/repository.impl.js';
export type { ProductOpportunityRepository } from './product-discovery/repository.js';
export { createProductOpportunityRepository } from './product-discovery/repository.impl.js';
export type { MachineOpportunityRepository } from './machine-discovery/repository.js';
export { createMachineOpportunityRepository } from './machine-discovery/repository.impl.js';
export type { PriceAnalysisRepository } from './pricing-intelligence/repository.js';
export { createPriceAnalysisRepository } from './pricing-intelligence/repository.impl.js';
export type { CustomerInsightRepository } from './customer-insights/repository.js';
export { createCustomerInsightRepository } from './customer-insights/repository.impl.js';
export type { KnowledgeFindingRepository } from './knowledge-mining/repository.js';
export { createKnowledgeFindingRepository } from './knowledge-mining/repository.impl.js';
export type { ForecastRepository } from './forecasting/repository.js';
export { createForecastRepository } from './forecasting/repository.impl.js';
export {
  createForecaster,
  type Forecaster,
  type ForecastInput,
  type HistoricalPoint,
} from './forecasting/forecaster.impl.js';
export type { RecommendationCandidateRepository } from './recommendation-engine/repository.js';
export { createRecommendationCandidateRepository } from './recommendation-engine/repository.impl.js';
export {
  createRecommender,
  type Recommender,
  type CreateCandidateInput,
} from './recommendation-engine/recommender.impl.js';
export type { IntelligenceScoreRepository } from './scoring/repository.js';
export { createIntelligenceScoreRepository } from './scoring/repository.impl.js';
export {
  createScorer,
  computeCompositeScore,
  type Scorer,
  type ScoringInput,
  type ScoringWeights,
} from './scoring/scorer.impl.js';
export type { RankingResultRepository } from './ranking/repository.js';
export { createRankingResultRepository } from './ranking/repository.impl.js';
export { createRanker, type Ranker, type RankableItem } from './ranking/ranker.impl.js';
export type { SignalRepository } from './signals/repository.js';
export { createSignalRepository } from './signals/repository.impl.js';
export type { BusinessOpportunityRepository } from './opportunities/repository.js';
export { createBusinessOpportunityRepository } from './opportunities/repository.impl.js';
