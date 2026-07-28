/**
 * Real {@link CustomerSuccessQueries} implementation — a CQRS read
 * layer composed over the Customer Success Engine repositories.
 * Repositories are taken as constructor dependencies but never
 * returned to callers.
 *
 * @module queries/customer-success-queries.impl
 */
import type { CustomerSuccessRecordRepository } from '../customer/repository.js';
import type { ExpansionOpportunityRepository } from '../expansion/repository.js';
import type { FeedbackEntryRepository } from '../feedback/repository.js';
import type { HealthSnapshotRepository } from '../health/repository.js';
import type { RenewalRepository } from '../renewal/repository.js';
import type { CustomerRiskRepository } from '../risk/repository.js';
import type { SuccessPlanRepository } from '../successplan/repository.js';
import type { CustomerSuccessQueries } from './customer-success-queries.js';
import type {
  FindCustomersQuery,
  FindCustomersResult,
  FindExpansionQuery,
  FindExpansionResult,
  FindFeedbackQuery,
  FindFeedbackResult,
  FindHealthQuery,
  FindHealthResult,
  FindPlansQuery,
  FindPlansResult,
  FindRenewalsQuery,
  FindRenewalsResult,
  FindRisksQuery,
  FindRisksResult,
  SearchCustomerSuccessMatch,
  SearchCustomerSuccessQuery,
  SearchCustomerSuccessResult,
} from './types.js';

export interface CustomerSuccessQueriesDeps {
  readonly customerRepository: CustomerSuccessRecordRepository;
  readonly healthRepository: HealthSnapshotRepository;
  readonly renewalRepository: RenewalRepository;
  readonly planRepository: SuccessPlanRepository;
  readonly feedbackRepository: FeedbackEntryRepository;
  readonly riskRepository: CustomerRiskRepository;
  readonly expansionRepository: ExpansionOpportunityRepository;
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

/** Creates a real {@link CustomerSuccessQueries} read port over the given repositories. */
export function createCustomerSuccessQueries(deps: CustomerSuccessQueriesDeps): CustomerSuccessQueries {
  return {
    async findCustomers(query: FindCustomersQuery): Promise<FindCustomersResult> {
      let records = query.customerId
        ? await deps.customerRepository.findByCustomer(query.organizationId, query.customerId).then((record) => (record ? [record] : []))
        : await deps.customerRepository.findAll(query.organizationId);
      if (query.status) records = records.filter((record) => record.status === query.status);
      return { records: paginate(records, query.offset, query.limit), total: records.length };
    },

    async findHealth(query: FindHealthQuery): Promise<FindHealthResult> {
      const snapshots = query.customerId
        ? await deps.healthRepository.findByCustomer(query.organizationId, query.customerId)
        : await deps.healthRepository.findAll(query.organizationId);
      return { snapshots: paginate(snapshots, query.offset, query.limit), total: snapshots.length };
    },

    async findRenewals(query: FindRenewalsQuery): Promise<FindRenewalsResult> {
      let renewals = query.customerId
        ? await deps.renewalRepository.findByCustomer(query.organizationId, query.customerId)
        : await deps.renewalRepository.findAll(query.organizationId);
      if (query.status) renewals = renewals.filter((renewal) => renewal.status === query.status);
      return { renewals: paginate(renewals, query.offset, query.limit), total: renewals.length };
    },

    async findPlans(query: FindPlansQuery): Promise<FindPlansResult> {
      let plans = query.customerId
        ? await deps.planRepository.findByCustomer(query.organizationId, query.customerId)
        : await deps.planRepository.findAll(query.organizationId);
      if (query.status) plans = plans.filter((plan) => plan.status === query.status);
      return { plans: paginate(plans, query.offset, query.limit), total: plans.length };
    },

    async findFeedback(query: FindFeedbackQuery): Promise<FindFeedbackResult> {
      let entries = query.customerId
        ? await deps.feedbackRepository.findByCustomer(query.organizationId, query.customerId)
        : await deps.feedbackRepository.findAll(query.organizationId);
      if (query.feedbackType) entries = entries.filter((entry) => entry.feedbackType === query.feedbackType);
      return { entries: paginate(entries, query.offset, query.limit), total: entries.length };
    },

    async findRisks(query: FindRisksQuery): Promise<FindRisksResult> {
      let risks = query.customerId
        ? await deps.riskRepository.findByCustomer(query.organizationId, query.customerId)
        : await deps.riskRepository.findAll(query.organizationId);
      if (query.status) risks = risks.filter((risk) => risk.status === query.status);
      return { risks: paginate(risks, query.offset, query.limit), total: risks.length };
    },

    async findExpansion(query: FindExpansionQuery): Promise<FindExpansionResult> {
      let opportunities = query.customerId
        ? await deps.expansionRepository.findByCustomer(query.organizationId, query.customerId)
        : await deps.expansionRepository.findAll(query.organizationId);
      if (query.opportunityType) opportunities = opportunities.filter((opportunity) => opportunity.opportunityType === query.opportunityType);
      if (query.status) opportunities = opportunities.filter((opportunity) => opportunity.status === query.status);
      return { opportunities: paginate(opportunities, query.offset, query.limit), total: opportunities.length };
    },

    async searchCustomerSuccess(query: SearchCustomerSuccessQuery): Promise<SearchCustomerSuccessResult> {
      const [records, plans, risks] = await Promise.all([
        deps.customerRepository.findAll(query.organizationId),
        deps.planRepository.findAll(query.organizationId),
        deps.riskRepository.findAll(query.organizationId),
      ]);

      const matches: SearchCustomerSuccessMatch[] = [];
      for (const record of records) {
        const score = scoreLabel(record.customerId, query.keyword);
        if (score > 0) matches.push({ recordType: 'customer', id: record.id, label: record.customerId, score });
      }
      for (const plan of plans) {
        const score = scoreLabel(plan.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'plan', id: plan.id, label: plan.name, score });
      }
      for (const risk of risks) {
        const score = scoreLabel(risk.title, query.keyword);
        if (score > 0) matches.push({ recordType: 'risk', id: risk.id, label: risk.title, score });
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
