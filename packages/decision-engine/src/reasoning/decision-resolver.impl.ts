/**
 * Real {@link DecisionResolver} implementation — derives the final decision
 * status from the approval flow when present, otherwise from the
 * evaluation's pass/fail outcome.
 *
 * @module reasoning/decision-resolver.impl
 */
import type { DecisionStatus } from '../decision/types.js';
import type { DecisionResolution, DecisionResolver } from './decision-resolver.js';

/** Creates a {@link DecisionResolver} that derives status from approval (if present) or evaluation outcome. */
export function createDecisionResolver(): DecisionResolver {
  return {
    async resolve(decision, evaluation, approval): Promise<DecisionResolution> {
      let status: DecisionStatus;
      if (approval) {
        status =
          approval.status === 'approved'
            ? 'approved'
            : approval.status === 'rejected'
              ? 'rejected'
              : 'pending_approval';
      } else {
        status = evaluation.passed ? 'approved' : 'rejected';
      }

      return {
        decision: { ...decision, status, decidedAt: new Date().toISOString() },
        evaluationResult: evaluation,
        approvalFlow: approval,
      };
    },
  };
}
