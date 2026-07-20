/**
 * Decision resolver port — resolves final decision outcome from evaluation and approval.
 *
 * @module reasoning/decision-resolver
 */

import type { Decision } from '../decision/types.js';
import type { ApprovalFlow } from '../approval/types.js';
import type { EvaluationResult } from '../evaluation/types.js';
import type { Recommendation } from '../recommendation/types.js';

/** Resolved outcome of the decision process. */
export interface DecisionResolution {
  readonly decision: Decision;
  readonly selectedRecommendation?: Recommendation;
  readonly evaluationResult: EvaluationResult;
  readonly approvalFlow?: ApprovalFlow;
}

/** Port for resolving the canonical decision outcome. */
export interface DecisionResolver {
  resolve(
    decision: Decision,
    evaluation: EvaluationResult,
    approval?: ApprovalFlow,
  ): Promise<DecisionResolution>;
}
