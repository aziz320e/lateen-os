/** @module queries/types */
import type { OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Organization, OrganizationStatus } from '../organization/types.js';
import type { BusinessProfile } from '../business-profile/types.js';
import type { Product, ProductCategory, ProductStatus } from '../product/types.js';
import type { Competitor, CompetitorStatus } from '../competitor/types.js';
import type { Policy, PolicyStatus, PolicyType } from '../policy/types.js';
import type { MarketModel } from '../market/types.js';

export interface FindOrganizationsQuery {
  readonly status?: OrganizationStatus;
  readonly code?: BusinessCode;
  readonly domain?: string;
  readonly offset?: number;
  readonly limit?: number;
}

export interface FindOrganizationsResult {
  readonly organizations: readonly Organization[];
  readonly total: number;
}

export interface FindBusinessProfileQuery {
  readonly organizationId: OrganizationId;
}

export interface FindBusinessProfileResult {
  readonly profile: BusinessProfile | null;
}

export interface FindProductsQuery extends OrganizationScopedQuery {
  readonly category?: ProductCategory;
  readonly status?: ProductStatus;
}

export interface FindProductsResult {
  readonly products: readonly Product[];
  readonly total: number;
}

export interface FindCompetitorsQuery extends OrganizationScopedQuery {
  readonly status?: CompetitorStatus;
}

export interface FindCompetitorsResult {
  readonly competitors: readonly Competitor[];
  readonly total: number;
}

export interface FindPoliciesQuery extends OrganizationScopedQuery {
  readonly type?: PolicyType;
  readonly status?: PolicyStatus;
}

export interface FindPoliciesResult {
  readonly policies: readonly Policy[];
  readonly total: number;
}

export interface FindMarketsQuery {
  readonly organizationId: OrganizationId;
}

export interface FindMarketsResult {
  readonly market: MarketModel | null;
}

export type { OrganizationId };
