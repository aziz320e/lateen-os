/**
 * Real {@link GovernanceQueries} implementation — a CQRS read layer
 * composed over the AI Governance Engine repositories. Repositories are
 * taken as constructor dependencies but never returned to callers.
 *
 * @module queries/governance-queries.impl
 */
import type { ApprovalRequestRepository, GovernanceExceptionRepository } from '../approval/repository.js';
import type { DecisionRepository } from '../decision/repository.js';
import type { GovernancePolicyRepository, GovernancePolicyVersionRepository } from '../policy/repository.js';
import type { GovernanceRuleRepository } from '../rules-engine/repository.js';
import type { RiskRepository } from '../risk/repository.js';
import type { GovernanceQueries } from './governance-queries.js';
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
  SearchGovernanceMatch,
  SearchGovernanceQuery,
  SearchGovernanceResult,
} from './types.js';

export interface GovernanceQueriesDeps {
  readonly policyRepository: GovernancePolicyRepository;
  readonly policyVersionRepository: GovernancePolicyVersionRepository;
  readonly approvalRequestRepository: ApprovalRequestRepository;
  readonly exceptionRepository: GovernanceExceptionRepository;
  readonly riskRepository: RiskRepository;
  readonly decisionRepository: DecisionRepository;
  readonly ruleRepository: GovernanceRuleRepository;
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

/** Creates a real {@link GovernanceQueries} read port over the given repositories. */
export function createGovernanceQueries(deps: GovernanceQueriesDeps): GovernanceQueries {
  return {
    async findPolicies(query: FindPoliciesQuery): Promise<FindPoliciesResult> {
      let policies = query.policyType
        ? await deps.policyRepository.findByType(query.organizationId, query.policyType)
        : await deps.policyRepository.findAll(query.organizationId);
      if (query.status) policies = policies.filter((policy) => policy.status === query.status);
      return { policies: paginate(policies, query.offset, query.limit), total: policies.length };
    },

    async findPolicyVersions(query: FindPolicyVersionsQuery): Promise<FindPolicyVersionsResult> {
      const versions = await deps.policyVersionRepository.findByPolicyId(query.organizationId, query.policyId);
      return { versions };
    },

    async findApprovals(query: FindApprovalsQuery): Promise<FindApprovalsResult> {
      let approvals = query.category
        ? await deps.approvalRequestRepository.findByCategory(query.organizationId, query.category)
        : await deps.approvalRequestRepository.findAll(query.organizationId);
      if (query.status) approvals = approvals.filter((approval) => approval.status === query.status);
      return { approvals: paginate(approvals, query.offset, query.limit), total: approvals.length };
    },

    async findRisks(query: FindRisksQuery): Promise<FindRisksResult> {
      let risks = query.riskLevel
        ? await deps.riskRepository.findByLevel(query.organizationId, query.riskLevel)
        : await deps.riskRepository.findAll(query.organizationId);
      if (query.status) risks = risks.filter((risk) => risk.status === query.status);
      return { risks: paginate(risks, query.offset, query.limit), total: risks.length };
    },

    async findExceptions(query: FindExceptionsQuery): Promise<FindExceptionsResult> {
      const exceptions = await deps.exceptionRepository.findAll(query.organizationId);
      return { exceptions: paginate(exceptions, query.offset, query.limit), total: exceptions.length };
    },

    async findGovernanceEvents(query: FindGovernanceEventsQuery): Promise<FindGovernanceEventsResult> {
      let events = await deps.decisionRepository.findAll(query.organizationId);
      if (query.decisionType) events = events.filter((event) => event.decisionType === query.decisionType);
      if (query.outcome) events = events.filter((event) => event.outcome === query.outcome);
      return { events: paginate(events, query.offset, query.limit), total: events.length };
    },

    async searchGovernance(query: SearchGovernanceQuery): Promise<SearchGovernanceResult> {
      const [policies, risks, rules] = await Promise.all([
        deps.policyRepository.findAll(query.organizationId),
        deps.riskRepository.findAll(query.organizationId),
        deps.ruleRepository.findAll(query.organizationId),
      ]);

      const matches: SearchGovernanceMatch[] = [];
      for (const policy of policies) {
        const score = scoreLabel(policy.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'policy', id: policy.id, label: policy.name, score });
      }
      for (const risk of risks) {
        const score = scoreLabel(risk.title, query.keyword);
        if (score > 0) matches.push({ recordType: 'risk', id: risk.id, label: risk.title, score });
      }
      for (const rule of rules) {
        const score = scoreLabel(rule.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'rule', id: rule.id, label: rule.name, score });
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
