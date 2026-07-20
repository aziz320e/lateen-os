/** @module domain/decision-submission */
import type { DecisionCategory } from '@lateen-os/decision-engine';
import type { RecommendationCandidateId } from '@lateen-os/intelligence-engine';
import type { DecisionId, OrganizationId, ProfitEstimateId } from './identifiers.js';

export type DecisionSubmissionStatus = 'prepared' | 'submitted' | 'accepted' | 'rejected';

/** Package submitted to the Decision Engine for evaluation. */
export interface DecisionSubmission {
  readonly organizationId: OrganizationId;
  readonly decisionId: DecisionId;
  readonly recommendationCandidateId: RecommendationCandidateId;
  readonly profitEstimateIds: readonly ProfitEstimateId[];
  readonly decisionCategory: DecisionCategory;
  readonly title: string;
  readonly summary: string;
  readonly proposedAction: string;
  readonly status: DecisionSubmissionStatus;
}

export interface DecisionSubmissionResult {
  readonly submission: DecisionSubmission;
}
