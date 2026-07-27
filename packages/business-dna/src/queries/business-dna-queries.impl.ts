/**
 * Real {@link BusinessDnaQueries} implementation — a CQRS read layer
 * composed over the repository ports. Repositories are taken as
 * constructor dependencies but never returned to callers.
 *
 * @module queries/business-dna-queries.impl
 */
import type { BusinessProfileRepository } from '../business-profile/repository.js';
import type { CompetitorRepository } from '../competitor/repository.js';
import type { MarketModelRepository } from '../market/repository.js';
import type { OrganizationRepository } from '../organization/repository.js';
import type { PolicyRepository } from '../policy/repository.js';
import type { ProductRepository } from '../product/repository.js';
import type { BusinessDnaQueries } from './business-dna-queries.js';
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

export interface BusinessDnaQueriesDeps {
  readonly organizationRepository: OrganizationRepository;
  readonly businessProfileRepository: BusinessProfileRepository;
  readonly productRepository: ProductRepository;
  readonly competitorRepository: CompetitorRepository;
  readonly policyRepository: PolicyRepository;
  readonly marketModelRepository: MarketModelRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

/** Creates a real {@link BusinessDnaQueries} read port over the given repositories. */
export function createBusinessDnaQueries(deps: BusinessDnaQueriesDeps): BusinessDnaQueries {
  return {
    async findOrganizations(query: FindOrganizationsQuery): Promise<FindOrganizationsResult> {
      let organizations;
      if (query.code) {
        const organization = await deps.organizationRepository.findByCode(query.code);
        organizations = organization ? [organization] : [];
      } else if (query.domain) {
        const organization = await deps.organizationRepository.findByDomain(query.domain);
        organizations = organization ? [organization] : [];
      } else if (query.status) {
        organizations = await deps.organizationRepository.findByStatus(query.status);
      } else {
        organizations = await deps.organizationRepository.findAll();
      }
      return { organizations: paginate(organizations, query.offset, query.limit), total: organizations.length };
    },

    async findBusinessProfile(query: FindBusinessProfileQuery): Promise<FindBusinessProfileResult> {
      return { profile: await deps.businessProfileRepository.findByOrganization(query.organizationId) };
    },

    async findProducts(query: FindProductsQuery): Promise<FindProductsResult> {
      let products;
      if (query.category) {
        products = await deps.productRepository.findByCategory(query.organizationId, query.category);
      } else if (query.status) {
        products = await deps.productRepository.findByStatus(query.organizationId, query.status);
      } else {
        products = await deps.productRepository.findAll(query.organizationId);
      }
      return { products: paginate(products, query.offset, query.limit), total: products.length };
    },

    async findCompetitors(query: FindCompetitorsQuery): Promise<FindCompetitorsResult> {
      const competitors = query.status
        ? await deps.competitorRepository.findByStatus(query.organizationId, query.status)
        : await deps.competitorRepository.findAll(query.organizationId);
      return { competitors: paginate(competitors, query.offset, query.limit), total: competitors.length };
    },

    async findPolicies(query: FindPoliciesQuery): Promise<FindPoliciesResult> {
      let policies;
      if (query.type) {
        policies = await deps.policyRepository.findByType(query.organizationId, query.type);
      } else {
        policies = await deps.policyRepository.findAll(query.organizationId);
      }
      const filtered = query.status ? policies.filter((policy) => policy.status === query.status) : policies;
      return { policies: paginate(filtered, query.offset, query.limit), total: filtered.length };
    },

    async findMarkets(query: FindMarketsQuery): Promise<FindMarketsResult> {
      return { market: await deps.marketModelRepository.findByOrganization(query.organizationId) };
    },
  };
}
