/** @module queries/types */
import type { ApprovalCategory, ApprovalRequest, ApprovalStatus, GovernanceException } from '../approval/types.js';
import type { Decision, DecisionOutcome } from '../decision/types.js';
import type { GovernancePolicy, GovernancePolicyId, GovernancePolicyStatus, GovernancePolicyType, GovernancePolicyVersion } from '../policy/types.js';
import type { Risk, RiskLevel, RiskStatus } from '../risk/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';

export interface FindPoliciesQuery extends OrganizationScopedQuery {
  readonly policyType?: GovernancePolicyType;
  readonly status?: GovernancePolicyStatus;
}

export interface FindPoliciesResult {
  readonly policies: readonly GovernancePolicy[];
  readonly total: number;
}

export interface FindPolicyVersionsQuery {
  readonly organizationId: OrganizationId;
  readonly policyId: GovernancePolicyId;
}

export interface FindPolicyVersionsResult {
  readonly versions: readonly GovernancePolicyVersion[];
}

export interface FindApprovalsQuery extends OrganizationScopedQuery {
  readonly category?: ApprovalCategory;
  readonly status?: ApprovalStatus;
}

export interface FindApprovalsResult {
  readonly approvals: readonly ApprovalRequest[];
  readonly total: number;
}

export interface FindRisksQuery extends OrganizationScopedQuery {
  readonly riskLevel?: RiskLevel;
  readonly status?: RiskStatus;
}

export interface FindRisksResult {
  readonly risks: readonly Risk[];
  readonly total: number;
}

export interface FindExceptionsQuery extends OrganizationScopedQuery {}

export interface FindExceptionsResult {
  readonly exceptions: readonly GovernanceException[];
  readonly total: number;
}

export interface FindGovernanceEventsQuery extends OrganizationScopedQuery {
  readonly decisionType?: string;
  readonly outcome?: DecisionOutcome;
}

export interface FindGovernanceEventsResult {
  readonly events: readonly Decision[];
  readonly total: number;
}

export interface SearchGovernanceQuery extends OrganizationScopedQuery {
  readonly keyword: string;
}

export interface SearchGovernanceMatch {
  readonly recordType: 'policy' | 'risk' | 'rule';
  readonly id: string;
  readonly label: string;
  readonly score: number;
}

export interface SearchGovernanceResult {
  readonly matches: readonly SearchGovernanceMatch[];
  readonly total: number;
}
