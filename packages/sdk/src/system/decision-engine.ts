/**
 * DecisionEngine facade — composes `@lateen-os/decision-engine`'s real
 * reasoner and query layer over its in-memory repositories. Repositories
 * are constructed and wired here only; they are never exposed on the
 * returned facade.
 *
 * @module system/decision-engine
 */
import {
  createApprovalFlowRepository,
  createDecisionQueries,
  createDecisionRepository,
  createReasoner,
  createRecommendationRepository,
  createRiskAssessmentRepository,
} from '@lateen-os/decision-engine';
import type { DecisionQueries, Reasoner } from '@lateen-os/decision-engine';

/** Public decision-making facade — a real reasoner plus a read-only query layer. No repositories exposed. */
export interface DecisionEngine {
  readonly reasoner: Reasoner;
  readonly queries: DecisionQueries;
}

/** Creates a {@link DecisionEngine} over fresh in-memory repositories. */
export function createDecisionEngineFacade(): DecisionEngine {
  const decisionRepository = createDecisionRepository();
  const recommendationRepository = createRecommendationRepository();
  const approvalFlowRepository = createApprovalFlowRepository();
  const riskAssessmentRepository = createRiskAssessmentRepository();

  return {
    reasoner: createReasoner(),
    queries: createDecisionQueries({
      decisionRepository,
      recommendationRepository,
      approvalFlowRepository,
      riskAssessmentRepository,
    }),
  };
}
