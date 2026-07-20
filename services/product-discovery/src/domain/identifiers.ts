/** @module domain/identifiers */
import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { OrganizationId, ProductId, AgentId, MachineId, CustomerId, ProjectId, BranchId, DepartmentId } from '@lateen-os/business-dna';
export type { CapabilityId } from '@lateen-os/capability-engine';
export type { DecisionId } from '@lateen-os/decision-engine';
export type { GraphNodeId } from '@lateen-os/domain-graph';
export type { KnowledgeEntryId } from '@lateen-os/institutional-memory';
export type { RuntimeAgentId, TaskId } from '@lateen-os/ai-runtime';

export type ProductOpportunityId = Identifier;
export type RecommendationCandidateId = Identifier;

export type DiscoveryRunId = Identifier;
export type MarketSignalId = Identifier;
export type NormalizedSignalId = Identifier;
export type RankedOpportunityId = Identifier;
export type CapabilityMatchId = Identifier;
export type ProfitEstimateId = Identifier;
export type DiscoveryRecommendationId = Identifier;
