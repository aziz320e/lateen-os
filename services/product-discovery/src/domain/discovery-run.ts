/** @module domain/discovery-run */
import type { Timestamp } from '@lateen-os/shared-kernel/time';
import type { DiscoveryRunId, OrganizationId } from './identifiers.js';
import type { TenantAuditableEntity } from './entity.js';
import type { CollectSignalsResult } from './signal.js';
import type { NormalizeSignalsResult } from './normalized-signal.js';
import type { RankOpportunitiesResult } from './ranked-opportunity.js';
import type { CapabilityMatchingResult } from './capability-match.js';
import type { ProfitEstimationResult } from './profit-estimate.js';
import type { DecisionSubmissionResult } from './decision-submission.js';
import type { RecommendationResult } from './discovery-recommendation.js';

export type DiscoveryRunStatus =
  | 'pending'
  | 'collecting_signals'
  | 'normalizing'
  | 'ranking'
  | 'matching_capabilities'
  | 'estimating_profit'
  | 'submitting_decision'
  | 'producing_recommendation'
  | 'completed'
  | 'failed';

export type DiscoveryRunStage =
  | 'collect_signals'
  | 'normalize'
  | 'rank'
  | 'capability_matching'
  | 'profit_estimation'
  | 'decision_submission'
  | 'recommendation';

/** End-to-end product discovery execution record. */
export interface ProductDiscoveryRun extends TenantAuditableEntity<DiscoveryRunId> {
  readonly status: DiscoveryRunStatus;
  readonly currentStage?: DiscoveryRunStage;
  readonly startedAt: Timestamp;
  readonly completedAt?: Timestamp;
  readonly collectSignals?: CollectSignalsResult;
  readonly normalize?: NormalizeSignalsResult;
  readonly rank?: RankOpportunitiesResult;
  readonly capabilityMatching?: CapabilityMatchingResult;
  readonly profitEstimation?: ProfitEstimationResult;
  readonly decisionSubmission?: DecisionSubmissionResult;
  readonly recommendation?: RecommendationResult;
  readonly errorMessage?: string;
}

export type { OrganizationId };
