/**
 * Real {@link CrmQueries} implementation — a CQRS read layer composed
 * over the CRM repositories. Repositories are taken as constructor
 * dependencies but never returned to callers.
 *
 * @module queries/crm-queries.impl
 */
import type { AccountRepository } from '../account/repository.js';
import type { ActivityRepository } from '../activity/repository.js';
import { contactFullName } from '../contact/types.js';
import type { ContactRepository } from '../contact/repository.js';
import type { CustomerRepository } from '../customer/repository.js';
import type { LeadRepository } from '../lead/repository.js';
import type { DealStage } from '../opportunity/types.js';
import type { OpportunityRepository } from '../opportunity/repository.js';
import type { CrmQueries } from './crm-queries.js';
import type {
  FindAccountsQuery,
  FindAccountsResult,
  FindActivitiesQuery,
  FindActivitiesResult,
  FindContactsQuery,
  FindContactsResult,
  FindCustomersQuery,
  FindCustomersResult,
  FindDealsQuery,
  FindDealsResult,
  FindLeadsQuery,
  FindLeadsResult,
  FindOpportunitiesQuery,
  FindOpportunitiesResult,
  SearchCrmMatch,
  SearchCrmQuery,
  SearchCrmResult,
} from './types.js';

export interface CrmQueriesDeps {
  readonly customerRepository: CustomerRepository;
  readonly leadRepository: LeadRepository;
  readonly contactRepository: ContactRepository;
  readonly accountRepository: AccountRepository;
  readonly opportunityRepository: OpportunityRepository;
  readonly activityRepository: ActivityRepository;
}

const DEAL_STAGES: readonly DealStage[] = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

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

/** Creates a real {@link CrmQueries} read port over the given repositories. */
export function createCrmQueries(deps: CrmQueriesDeps): CrmQueries {
  return {
    async findCustomers(query: FindCustomersQuery): Promise<FindCustomersResult> {
      const customers = query.status
        ? await deps.customerRepository.findByStatus(query.organizationId, query.status)
        : await deps.customerRepository.findAll(query.organizationId);
      return { customers: paginate(customers, query.offset, query.limit), total: customers.length };
    },

    async findLeads(query: FindLeadsQuery): Promise<FindLeadsResult> {
      const leads = query.status
        ? await deps.leadRepository.findByStatus(query.organizationId, query.status)
        : await deps.leadRepository.findAll(query.organizationId);
      return { leads: paginate(leads, query.offset, query.limit), total: leads.length };
    },

    async findContacts(query: FindContactsQuery): Promise<FindContactsResult> {
      let contacts = query.status
        ? await deps.contactRepository.findByStatus(query.organizationId, query.status)
        : await deps.contactRepository.findAll(query.organizationId);
      if (query.customerId) contacts = contacts.filter((contact) => contact.customerId === query.customerId);
      if (query.accountId) contacts = contacts.filter((contact) => contact.accountId === query.accountId);
      return { contacts: paginate(contacts, query.offset, query.limit), total: contacts.length };
    },

    async findAccounts(query: FindAccountsQuery): Promise<FindAccountsResult> {
      const accounts = query.status
        ? await deps.accountRepository.findByStatus(query.organizationId, query.status)
        : await deps.accountRepository.findAll(query.organizationId);
      return { accounts: paginate(accounts, query.offset, query.limit), total: accounts.length };
    },

    async findDeals(query: FindDealsQuery): Promise<FindDealsResult> {
      const opportunities = await deps.opportunityRepository.findAll(query.organizationId);
      const groupedByStage = DEAL_STAGES.reduce<Record<DealStage, readonly typeof opportunities[number][]>>(
        (groups, stage) => {
          groups[stage] = opportunities.filter((opportunity) => opportunity.stage === stage);
          return groups;
        },
        {} as Record<DealStage, readonly typeof opportunities[number][]>,
      );
      return { groupedByStage, total: opportunities.length };
    },

    async findActivities(query: FindActivitiesQuery): Promise<FindActivitiesResult> {
      let activities = query.activityType
        ? await deps.activityRepository.findByType(query.organizationId, query.activityType)
        : await deps.activityRepository.findAll(query.organizationId);
      if (query.relatedEntityType) activities = activities.filter((activity) => activity.relatedTo.entityType === query.relatedEntityType);
      if (query.relatedEntityId) activities = activities.filter((activity) => activity.relatedTo.entityId === query.relatedEntityId);
      const sorted = [...activities].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
      return { activities: paginate(sorted, query.offset, query.limit), total: sorted.length };
    },

    async findOpportunities(query: FindOpportunitiesQuery): Promise<FindOpportunitiesResult> {
      let opportunities = query.stage
        ? await deps.opportunityRepository.findByStage(query.organizationId, query.stage)
        : await deps.opportunityRepository.findAll(query.organizationId);
      if (query.accountId) opportunities = opportunities.filter((opportunity) => opportunity.accountId === query.accountId);
      if (query.customerId) opportunities = opportunities.filter((opportunity) => opportunity.customerId === query.customerId);
      return { opportunities: paginate(opportunities, query.offset, query.limit), total: opportunities.length };
    },

    async searchCRM(query: SearchCrmQuery): Promise<SearchCrmResult> {
      const [customers, leads, contacts, accounts, opportunities] = await Promise.all([
        deps.customerRepository.findAll(query.organizationId),
        deps.leadRepository.findAll(query.organizationId),
        deps.contactRepository.findAll(query.organizationId),
        deps.accountRepository.findAll(query.organizationId),
        deps.opportunityRepository.findAll(query.organizationId),
      ]);

      const matches: SearchCrmMatch[] = [];
      for (const customer of customers) {
        const score = scoreLabel(customer.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'customer', id: customer.id, label: customer.name, score });
      }
      for (const lead of leads) {
        const score = scoreLabel(lead.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'lead', id: lead.id, label: lead.name, score });
      }
      for (const contact of contacts) {
        const label = contactFullName(contact);
        const score = scoreLabel(label, query.keyword);
        if (score > 0) matches.push({ recordType: 'contact', id: contact.id, label, score });
      }
      for (const account of accounts) {
        const score = scoreLabel(account.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'account', id: account.id, label: account.name, score });
      }
      for (const opportunity of opportunities) {
        const score = scoreLabel(opportunity.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'opportunity', id: opportunity.id, label: opportunity.name, score });
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
