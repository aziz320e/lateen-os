/** @module queries/business-dna-queries */
import type {
  FindBusinessProfileQuery,
  FindBusinessProfileResult,
  FindCompetitorsQuery,
  FindCompetitorsResult,
  FindMarketsQuery,
  FindMarketsResult,
  FindOrganizationsQuery,
  FindOrganizationsResult,
  FindPoliciesQuery,
  FindPoliciesResult,
  FindProductsQuery,
  FindProductsResult,
} from './types.js';

/**
 * Real-time read-side query port for the Business DNA runtime. Composed
 * purely over repositories — never exposes a repository directly.
 */
export interface BusinessDnaQueries {
  findOrganizations(query: FindOrganizationsQuery): Promise<FindOrganizationsResult>;

  findBusinessProfile(query: FindBusinessProfileQuery): Promise<FindBusinessProfileResult>;

  findProducts(query: FindProductsQuery): Promise<FindProductsResult>;

  findCompetitors(query: FindCompetitorsQuery): Promise<FindCompetitorsResult>;

  findPolicies(query: FindPoliciesQuery): Promise<FindPoliciesResult>;

  findMarkets(query: FindMarketsQuery): Promise<FindMarketsResult>;
}
