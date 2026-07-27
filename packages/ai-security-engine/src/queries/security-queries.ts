/** @module queries/security-queries */
import type {
  FindAuditEventsQuery,
  FindAuditEventsResult,
  FindPoliciesQuery,
  FindPoliciesResult,
  FindSecretsQuery,
  FindSecretsResult,
  FindThreatsQuery,
  FindThreatsResult,
  FindViolationsQuery,
  FindViolationsResult,
  SearchSecurityQuery,
  SearchSecurityResult,
} from './types.js';

/** Real, read-only AI Security Engine query port. */
export interface SecurityQueries {
  findAuditEvents(query: FindAuditEventsQuery): Promise<FindAuditEventsResult>;
  findThreats(query: FindThreatsQuery): Promise<FindThreatsResult>;
  findSecrets(query: FindSecretsQuery): Promise<FindSecretsResult>;
  findPolicies(query: FindPoliciesQuery): Promise<FindPoliciesResult>;
  findViolations(query: FindViolationsQuery): Promise<FindViolationsResult>;
  searchSecurity(query: SearchSecurityQuery): Promise<SearchSecurityResult>;
}
