/** @module queries/governance-queries */
import type {
  FindApprovalsQuery,
  FindApprovalsResult,
  FindExceptionsQuery,
  FindExceptionsResult,
  FindGovernanceEventsQuery,
  FindGovernanceEventsResult,
  FindPoliciesQuery,
  FindPoliciesResult,
  FindPolicyVersionsQuery,
  FindPolicyVersionsResult,
  FindRisksQuery,
  FindRisksResult,
  SearchGovernanceQuery,
  SearchGovernanceResult,
} from './types.js';

/** Real, read-only AI Governance Engine query port. */
export interface GovernanceQueries {
  findPolicies(query: FindPoliciesQuery): Promise<FindPoliciesResult>;
  findPolicyVersions(query: FindPolicyVersionsQuery): Promise<FindPolicyVersionsResult>;
  findApprovals(query: FindApprovalsQuery): Promise<FindApprovalsResult>;
  findRisks(query: FindRisksQuery): Promise<FindRisksResult>;
  findExceptions(query: FindExceptionsQuery): Promise<FindExceptionsResult>;
  findGovernanceEvents(query: FindGovernanceEventsQuery): Promise<FindGovernanceEventsResult>;
  searchGovernance(query: SearchGovernanceQuery): Promise<SearchGovernanceResult>;
}
