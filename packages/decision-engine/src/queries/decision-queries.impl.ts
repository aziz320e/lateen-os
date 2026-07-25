/**
 * Real {@link DecisionQueries} implementation — a CQRS read layer composed
 * over the repository ports. Depends only on the abstract repository
 * interfaces, not on any concrete (e.g. in-memory) implementation detail.
 *
 * @module queries/decision-queries.impl
 */
import type { ApprovalFlowRepository } from '../approval/repository.js';
import type { DecisionRepository } from '../decision/repository.js';
import type { RecommendationRepository } from '../recommendation/repository.js';
import type { RiskAssessmentRepository } from '../risk/repository.js';
import type { RiskLevel } from '../risk/types.js';
import type { DecisionId, OrganizationId } from '../shared/identifiers.js';
import type { PolicyViolation } from '../policy/types.js';
import type { DecisionQueries } from './decision-queries.js';

const RISK_LEVELS: readonly RiskLevel[] = ['critical', 'high', 'medium', 'low', 'negligible'];

export interface DecisionQueriesDeps {
  readonly decisionRepository: DecisionRepository;
  readonly recommendationRepository: RecommendationRepository;
  readonly approvalFlowRepository: ApprovalFlowRepository;
  readonly riskAssessmentRepository: RiskAssessmentRepository;
  /**
   * No PolicyViolation aggregate/repository exists in this package's
   * contracts — violations are produced transiently during evaluation
   * (see policy-evaluator.ts). Callers that persist them elsewhere can
   * supply a lookup here; otherwise findPolicyViolations returns none.
   */
  readonly getPolicyViolations?: (
    organizationId: OrganizationId,
    decisionId?: DecisionId,
  ) => Promise<readonly PolicyViolation[]>;
}

/** Creates a {@link DecisionQueries} read port over the given repositories. */
export function createDecisionQueries(deps: DecisionQueriesDeps): DecisionQueries {
  return {
    async findDecision(organizationId, decisionId) {
      return deps.decisionRepository.findById(organizationId, decisionId);
    },

    async findRecommendations(organizationId, decisionId) {
      return deps.recommendationRepository.findByDecision(organizationId, decisionId);
    },

    async findPendingApprovals(query) {
      const [pending, inProgress] = await Promise.all([
        deps.approvalFlowRepository.findByStatus(query.organizationId, 'pending'),
        deps.approvalFlowRepository.findByStatus(query.organizationId, 'in_progress'),
      ]);
      return { flows: [...pending, ...inProgress] };
    },

    async findRisks(organizationId, decisionId) {
      if (decisionId) {
        const decision = await deps.decisionRepository.findById(organizationId, decisionId);
        if (!decision?.riskAssessmentId) return { assessments: [] };
        const assessment = await deps.riskAssessmentRepository.findById(organizationId, decision.riskAssessmentId);
        return { assessments: assessment ? [assessment] : [] };
      }
      const byLevel = await Promise.all(
        RISK_LEVELS.map((level) => deps.riskAssessmentRepository.findByLevel(organizationId, level)),
      );
      return { assessments: byLevel.flat() };
    },

    async findPolicyViolations(organizationId, decisionId) {
      const violations = deps.getPolicyViolations ? await deps.getPolicyViolations(organizationId, decisionId) : [];
      return { violations, decisionId };
    },

    async findAlternativeDecisions(organizationId, decisionId) {
      const decision = await deps.decisionRepository.findById(organizationId, decisionId);
      if (!decision) {
        throw new Error(`Decision "${decisionId}" not found`);
      }
      const recommendations = await deps.recommendationRepository.findByDecision(organizationId, decisionId);
      return { decision, alternatives: recommendations.flatMap((recommendation) => recommendation.alternatives) };
    },
  };
}
