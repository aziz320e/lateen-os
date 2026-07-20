/**
 * Decision query result types.
 *
 * @module queries/types
 */

import type { ApprovalFlow } from '../approval/types.js';
import type { Decision } from '../decision/types.js';
import type { PolicyViolation } from '../policy/types.js';
import type { Recommendation } from '../recommendation/types.js';
import type { RiskAssessment } from '../risk/types.js';
import type { DecisionId } from '../shared/identifiers.js';
import type { Alternative } from '../recommendation/types.js';

/** Pending approval items for an organization. */
export interface PendingApprovalsResult {
  readonly flows: readonly ApprovalFlow[];
}

/** Risk assessments linked to decisions. */
export interface DecisionRisksResult {
  readonly assessments: readonly RiskAssessment[];
}

/** Policy violations detected during decision processing. */
export interface PolicyViolationsResult {
  readonly violations: readonly PolicyViolation[];
  readonly decisionId?: DecisionId;
}

/** Alternative options for a decision. */
export interface AlternativeDecisionsResult {
  readonly decision: Decision;
  readonly alternatives: readonly Alternative[];
}
