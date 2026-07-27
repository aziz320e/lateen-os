/**
 * Real {@link SecurityQueries} implementation — a CQRS read layer
 * composed over the AI Security Engine repositories. Repositories are
 * taken as constructor dependencies but never returned to callers.
 *
 * @module queries/security-queries.impl
 */
import type { AuditEventRepository } from '../audit/repository.js';
import type { PolicyRepository } from '../authorization/repository.js';
import type { SecretRepository } from '../secrets/repository.js';
import type { ThreatRepository } from '../threat-detection/repository.js';
import type { SecurityQueries } from './security-queries.js';
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
  SearchSecurityMatch,
  SearchSecurityQuery,
  SearchSecurityResult,
} from './types.js';

export interface SecurityQueriesDeps {
  readonly auditEventRepository: AuditEventRepository;
  readonly threatRepository: ThreatRepository;
  readonly secretRepository: SecretRepository;
  readonly policyRepository: PolicyRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}

/** Creates a real {@link SecurityQueries} read port over the given repositories. */
export function createSecurityQueries(deps: SecurityQueriesDeps): SecurityQueries {
  return {
    async findAuditEvents(query: FindAuditEventsQuery): Promise<FindAuditEventsResult> {
      let events = query.category
        ? await deps.auditEventRepository.findByCategory(query.organizationId, query.category)
        : await deps.auditEventRepository.findAll(query.organizationId);
      if (query.outcome) events = events.filter((event) => event.outcome === query.outcome);
      if (query.actorId) events = events.filter((event) => event.actorId === query.actorId);
      return { events: paginate(events, query.offset, query.limit), total: events.length };
    },

    async findThreats(query: FindThreatsQuery): Promise<FindThreatsResult> {
      let threats = query.threatType
        ? await deps.threatRepository.findByType(query.organizationId, query.threatType)
        : await deps.threatRepository.findAll(query.organizationId);
      if (query.severity) threats = threats.filter((threat) => threat.severity === query.severity);
      return { threats: paginate(threats, query.offset, query.limit), total: threats.length };
    },

    async findSecrets(query: FindSecretsQuery): Promise<FindSecretsResult> {
      let secrets = query.secretType
        ? await deps.secretRepository.findByType(query.organizationId, query.secretType)
        : await deps.secretRepository.findAll(query.organizationId);
      if (query.status) secrets = secrets.filter((secret) => secret.status === query.status);
      return { secrets: paginate(secrets, query.offset, query.limit), total: secrets.length };
    },

    async findPolicies(query: FindPoliciesQuery): Promise<FindPoliciesResult> {
      let policies = query.status
        ? await deps.policyRepository.findByStatus(query.organizationId, query.status)
        : await deps.policyRepository.findAll(query.organizationId);
      if (query.policyType) policies = policies.filter((policy) => policy.policyType === query.policyType);
      return { policies: paginate(policies, query.offset, query.limit), total: policies.length };
    },

    async findViolations(query: FindViolationsQuery): Promise<FindViolationsResult> {
      const all = await deps.auditEventRepository.findAll(query.organizationId);
      const violations = all.filter((event) => event.outcome !== 'success');
      return { violations: paginate(violations, query.offset, query.limit), total: violations.length };
    },

    async searchSecurity(query: SearchSecurityQuery): Promise<SearchSecurityResult> {
      const [policies, secrets] = await Promise.all([
        deps.policyRepository.findAll(query.organizationId),
        deps.secretRepository.findAll(query.organizationId),
      ]);

      const matches: SearchSecurityMatch[] = [];
      for (const policy of policies) {
        const score = scoreLabel(policy.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'policy', id: policy.id, label: policy.name, score });
      }
      for (const secret of secrets) {
        const score = scoreLabel(secret.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'secret', id: secret.id, label: secret.name, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      const limited = query.limit === undefined ? matches : matches.slice(0, query.limit);
      return { matches: limited, total: matches.length };
    },
  };
}
