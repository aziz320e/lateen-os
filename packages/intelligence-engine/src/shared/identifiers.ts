/**
 * Identifier types for the Intelligence Engine bounded context.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type {
  CustomerId,
  MachineId,
  OrganizationId,
  ProductId,
  ProjectId,
  SupplierId,
} from '@lateen-os/business-dna';

export type { CapabilityId } from '@lateen-os/capability-engine';
export type { GraphNodeId, GraphNodeType } from '@lateen-os/domain-graph';
export type { KnowledgeEntryId } from '@lateen-os/institutional-memory';

export type TrendId = Identifier;
export type TrendSignalId = Identifier;
export type MarketId = Identifier;
export type MarketSegmentId = Identifier;
export type CompetitorId = Identifier;
export type ProductOpportunityId = Identifier;
export type ProductIdeaId = Identifier;
export type MachineOpportunityId = Identifier;
export type PriceAnalysisId = Identifier;
export type CustomerInsightId = Identifier;
export type KnowledgeFindingId = Identifier;
export type ForecastId = Identifier;
export type RecommendationCandidateId = Identifier;
export type SignalId = Identifier;
export type BusinessOpportunityId = Identifier;
export type RankingResultId = Identifier;
export type IntelligenceScoreId = Identifier;
