/**
 * Decision Engine query port — read-side discovery and monitoring.
 *
 * @module queries/decision-queries
 */

import type { DecisionId, OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { Decision } from '../decision/types.js';
import type { Recommendation } from '../recommendation/types.js';
import type {
  AlternativeDecisionsResult,
  DecisionRisksResult,
  PendingApprovalsResult,
  PolicyViolationsResult,
} from './types.js';

/** Read-side query port for the Decision Engine. */
export interface DecisionQueries {
  findDecision(organizationId: OrganizationId, decisionId: DecisionId): Promise<Decision | null>;

  findRecommendations(
    organizationId: OrganizationId,
    decisionId: DecisionId,
  ): Promise<readonly Recommendation[]>;

  findPendingApprovals(query: OrganizationScopedQuery): Promise<PendingApprovalsResult>;

  findRisks(
    organizationId: OrganizationId,
    decisionId?: DecisionId,
  ): Promise<DecisionRisksResult>;

  findPolicyViolations(
    organizationId: OrganizationId,
    decisionId?: DecisionId,
  ): Promise<PolicyViolationsResult>;

  findAlternativeDecisions(
    organizationId: OrganizationId,
    decisionId: DecisionId,
  ): Promise<AlternativeDecisionsResult>;
}
