/** @module queries/types */
import type { AuditCategory, AuditEvent, AuditOutcome } from '../audit/types.js';
import type { Policy, PolicyStatus, PolicyType } from '../authorization/types.js';
import type { Secret, SecretStatus, SecretType } from '../secrets/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { Threat, ThreatSeverity, ThreatType } from '../threat-detection/types.js';

export interface FindAuditEventsQuery extends OrganizationScopedQuery {
  readonly category?: AuditCategory;
  readonly outcome?: AuditOutcome;
  readonly actorId?: string;
}
export interface FindAuditEventsResult {
  readonly events: readonly AuditEvent[];
  readonly total: number;
}

export interface FindThreatsQuery extends OrganizationScopedQuery {
  readonly threatType?: ThreatType;
  readonly severity?: ThreatSeverity;
}
export interface FindThreatsResult {
  readonly threats: readonly Threat[];
  readonly total: number;
}

export interface FindSecretsQuery extends OrganizationScopedQuery {
  readonly secretType?: SecretType;
  readonly status?: SecretStatus;
}
export interface FindSecretsResult {
  readonly secrets: readonly Secret[];
  readonly total: number;
}

export interface FindPoliciesQuery extends OrganizationScopedQuery {
  readonly policyType?: PolicyType;
  readonly status?: PolicyStatus;
}
export interface FindPoliciesResult {
  readonly policies: readonly Policy[];
  readonly total: number;
}

export type FindViolationsQuery = OrganizationScopedQuery;
export interface FindViolationsResult {
  readonly violations: readonly AuditEvent[];
  readonly total: number;
}

export type SearchSecurityRecordType = 'policy' | 'secret';

export interface SearchSecurityQuery {
  readonly organizationId: OrganizationId;
  readonly keyword: string;
  readonly limit?: number;
}

export interface SearchSecurityMatch {
  readonly recordType: SearchSecurityRecordType;
  readonly id: string;
  readonly label: string;
  readonly score: number;
}

export interface SearchSecurityResult {
  readonly matches: readonly SearchSecurityMatch[];
  readonly total: number;
}
