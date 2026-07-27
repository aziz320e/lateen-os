/** @module market/types */
import type { Entity } from '../shared/entity.js';
import type { MarketId, MarketModelId, OrganizationId } from '../shared/identifiers.js';
import type { Auditable, CurrencyCode, TenantScoped } from '../shared/primitives.js';

export type { MarketModelId, MarketId };

export type OperatingMarketStatus = 'active' | 'planned' | 'inactive';

/** A single country/region the organization operates in, with its languages and currency. */
export interface OperatingMarket {
  readonly marketId: MarketId;
  readonly countryCode: string;
  readonly countryName: string;
  readonly region?: string;
  readonly languages: readonly string[];
  readonly currency: CurrencyCode;
  readonly status: OperatingMarketStatus;
}

/**
 * Market Model — a singleton per organization holding every operating
 * market (country, region, languages, currency) the business serves.
 */
export interface MarketModel extends Entity<MarketModelId>, TenantScoped, Auditable {
  readonly operatingMarkets: readonly OperatingMarket[];
}

export type { OrganizationId };
