/** @module queries/crm-queries */
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
  SearchCrmQuery,
  SearchCrmResult,
} from './types.js';

/**
 * Real-time read-side query port for the CRM Engine runtime. Composed
 * purely over repositories — never exposes a repository directly.
 */
export interface CrmQueries {
  findCustomers(query: FindCustomersQuery): Promise<FindCustomersResult>;

  findLeads(query: FindLeadsQuery): Promise<FindLeadsResult>;

  findContacts(query: FindContactsQuery): Promise<FindContactsResult>;

  findAccounts(query: FindAccountsQuery): Promise<FindAccountsResult>;

  /** Opportunities grouped by pipeline stage — the Deal Pipeline view. */
  findDeals(query: FindDealsQuery): Promise<FindDealsResult>;

  findActivities(query: FindActivitiesQuery): Promise<FindActivitiesResult>;

  findOpportunities(query: FindOpportunitiesQuery): Promise<FindOpportunitiesResult>;

  /** Deterministic keyword search across customers, leads, contacts, accounts, and opportunities. */
  searchCRM(query: SearchCrmQuery): Promise<SearchCrmResult>;
}
