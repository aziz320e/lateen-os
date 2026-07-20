/** @module workflows/product-discovery-workflow */
import type {
  ProductDiscoveryWorkflowInput,
  ProductDiscoveryWorkflowOutput,
} from './types.js';
import type { CollectSignalsStage } from './stages/collect-signals-stage.js';
import type { NormalizeStage } from './stages/normalize-stage.js';
import type { RankStage } from './stages/rank-stage.js';
import type { CapabilityMatchingStage } from './stages/capability-matching-stage.js';
import type { ProfitEstimationStage } from './stages/profit-estimation-stage.js';
import type { DecisionSubmissionStage } from './stages/decision-submission-stage.js';
import type { RecommendationStage } from './stages/recommendation-stage.js';

export interface ProductDiscoveryWorkflowStages {
  readonly collectSignals: CollectSignalsStage;
  readonly normalize: NormalizeStage;
  readonly rank: RankStage;
  readonly capabilityMatching: CapabilityMatchingStage;
  readonly profitEstimation: ProfitEstimationStage;
  readonly decisionSubmission: DecisionSubmissionStage;
  readonly recommendation: RecommendationStage;
}

/**
 * Product Discovery workflow orchestrator.
 *
 * Collect Signals → Normalize → Rank → Capability Matching →
 * Profit Estimation → Decision Submission → Recommendation
 */
export interface ProductDiscoveryWorkflow {
  readonly stages: ProductDiscoveryWorkflowStages;

  execute(input: ProductDiscoveryWorkflowInput): Promise<ProductDiscoveryWorkflowOutput>;
}
