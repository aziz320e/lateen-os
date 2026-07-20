/** @module workflows/types */
import type { DiscoveryRunId, OrganizationId } from '../domain/identifiers.js';
import type { CollectSignalsResult } from '../domain/signal.js';
import type { NormalizeSignalsResult } from '../domain/normalized-signal.js';
import type { RankOpportunitiesResult } from '../domain/ranked-opportunity.js';
import type { CapabilityMatchingResult } from '../domain/capability-match.js';
import type { ProfitEstimationResult } from '../domain/profit-estimate.js';
import type { DecisionSubmissionResult } from '../domain/decision-submission.js';
import type { RecommendationResult } from '../domain/discovery-recommendation.js';
import type { ProductDiscoveryRun } from '../domain/discovery-run.js';

export interface WorkflowContext {
  readonly organizationId: OrganizationId;
  readonly runId: DiscoveryRunId;
  readonly keywords?: readonly string[];
  readonly runtimeAgentId?: string;
  readonly runtimeTaskId?: string;
}

export interface CollectSignalsStageInput extends WorkflowContext {}

export interface CollectSignalsStageOutput {
  readonly result: CollectSignalsResult;
}

export interface NormalizeStageInput extends WorkflowContext {
  readonly collectSignals: CollectSignalsResult;
}

export interface NormalizeStageOutput {
  readonly result: NormalizeSignalsResult;
}

export interface RankStageInput extends WorkflowContext {
  readonly normalize: NormalizeSignalsResult;
}

export interface RankStageOutput {
  readonly result: RankOpportunitiesResult;
}

export interface CapabilityMatchingStageInput extends WorkflowContext {
  readonly rank: RankOpportunitiesResult;
}

export interface CapabilityMatchingStageOutput {
  readonly result: CapabilityMatchingResult;
}

export interface ProfitEstimationStageInput extends WorkflowContext {
  readonly capabilityMatching: CapabilityMatchingResult;
}

export interface ProfitEstimationStageOutput {
  readonly result: ProfitEstimationResult;
}

export interface DecisionSubmissionStageInput extends WorkflowContext {
  readonly profitEstimation: ProfitEstimationResult;
}

export interface DecisionSubmissionStageOutput {
  readonly result: DecisionSubmissionResult;
}

export interface RecommendationStageInput extends WorkflowContext {
  readonly decisionSubmission: DecisionSubmissionResult;
  readonly capabilityMatching: CapabilityMatchingResult;
  readonly profitEstimation: ProfitEstimationResult;
}

export interface RecommendationStageOutput {
  readonly result: RecommendationResult;
}

export interface ProductDiscoveryWorkflowInput extends WorkflowContext {}

export interface ProductDiscoveryWorkflowOutput {
  readonly run: ProductDiscoveryRun;
}
