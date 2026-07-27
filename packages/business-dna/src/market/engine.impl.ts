/**
 * Real Market Model engine — a singleton-per-organization registry of
 * operating markets, with deterministic derived views over countries,
 * regions, languages, and currencies.
 *
 * @module market/engine.impl
 */
import { DuplicateOperatingMarketError, OperatingMarketNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { CurrencyCode } from '../shared/primitives.js';
import type { MarketModelRepository } from './repository.js';
import type { MarketId, MarketModel, OperatingMarket, OperatingMarketStatus } from './types.js';

export interface AddOperatingMarketInput {
  readonly countryCode: string;
  readonly countryName: string;
  readonly region?: string;
  readonly languages?: readonly string[];
  readonly currency: CurrencyCode;
  readonly status?: OperatingMarketStatus;
}

export interface UpdateOperatingMarketInput {
  readonly countryName?: string;
  readonly region?: string;
  readonly languages?: readonly string[];
  readonly currency?: CurrencyCode;
}

function sortedUnique(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export interface MarketEngine {
  addOperatingMarket(organizationId: OrganizationId, input: AddOperatingMarketInput): Promise<MarketModel>;
  updateOperatingMarket(organizationId: OrganizationId, marketId: MarketId, patch: UpdateOperatingMarketInput): Promise<MarketModel>;
  setOperatingMarketStatus(organizationId: OrganizationId, marketId: MarketId, status: OperatingMarketStatus): Promise<MarketModel>;
  removeOperatingMarket(organizationId: OrganizationId, marketId: MarketId): Promise<MarketModel>;
  get(organizationId: OrganizationId): Promise<MarketModel | null>;
  listCountries(organizationId: OrganizationId): Promise<readonly { readonly code: string; readonly name: string }[]>;
  listRegions(organizationId: OrganizationId): Promise<readonly string[]>;
  listLanguages(organizationId: OrganizationId): Promise<readonly string[]>;
  listCurrencies(organizationId: OrganizationId): Promise<readonly string[]>;
}

/** Creates a real {@link MarketEngine} backed by a {@link MarketModelRepository}. */
export function createMarketEngine(repository: MarketModelRepository, now: () => string = nowIso): MarketEngine {
  async function getOrCreate(organizationId: OrganizationId): Promise<MarketModel> {
    const existing = await repository.findByOrganization(organizationId);
    if (existing) return existing;
    const timestamp = now();
    const created: MarketModel = { id: organizationId, organizationId, createdAt: timestamp, updatedAt: timestamp, operatingMarkets: [] };
    await repository.save(created);
    return created;
  }

  async function requireMarket(organizationId: OrganizationId, marketId: MarketId): Promise<OperatingMarket> {
    const model = await getOrCreate(organizationId);
    const market = model.operatingMarkets.find((candidate) => candidate.marketId === marketId);
    if (!market) throw new OperatingMarketNotFoundError(marketId);
    return market;
  }

  return {
    async addOperatingMarket(organizationId, input) {
      const current = await getOrCreate(organizationId);
      if (current.operatingMarkets.some((market) => market.countryCode === input.countryCode)) {
        throw new DuplicateOperatingMarketError(input.countryCode);
      }
      const market: OperatingMarket = {
        marketId: generateId('market'),
        countryCode: input.countryCode,
        countryName: input.countryName,
        region: input.region,
        languages: input.languages ?? [],
        currency: input.currency,
        status: input.status ?? 'active',
      };
      const updated: MarketModel = { ...current, operatingMarkets: [...current.operatingMarkets, market], updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async updateOperatingMarket(organizationId, marketId, patch) {
      await requireMarket(organizationId, marketId);
      const current = await getOrCreate(organizationId);
      const updated: MarketModel = {
        ...current,
        operatingMarkets: current.operatingMarkets.map((market) => (market.marketId === marketId ? { ...market, ...patch } : market)),
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async setOperatingMarketStatus(organizationId, marketId, status) {
      await requireMarket(organizationId, marketId);
      const current = await getOrCreate(organizationId);
      const updated: MarketModel = {
        ...current,
        operatingMarkets: current.operatingMarkets.map((market) => (market.marketId === marketId ? { ...market, status } : market)),
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async removeOperatingMarket(organizationId, marketId) {
      await requireMarket(organizationId, marketId);
      const current = await getOrCreate(organizationId);
      const updated: MarketModel = {
        ...current,
        operatingMarkets: current.operatingMarkets.filter((market) => market.marketId !== marketId),
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId) {
      return repository.findByOrganization(organizationId);
    },

    async listCountries(organizationId) {
      const model = await getOrCreate(organizationId);
      const byCode = new Map<string, string>();
      for (const market of model.operatingMarkets) byCode.set(market.countryCode, market.countryName);
      return [...byCode.entries()]
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.code.localeCompare(b.code));
    },

    async listRegions(organizationId) {
      const model = await getOrCreate(organizationId);
      return sortedUnique(model.operatingMarkets.map((market) => market.region).filter((region): region is string => Boolean(region)));
    },

    async listLanguages(organizationId) {
      const model = await getOrCreate(organizationId);
      return sortedUnique(model.operatingMarkets.flatMap((market) => market.languages));
    },

    async listCurrencies(organizationId) {
      const model = await getOrCreate(organizationId);
      return sortedUnique(model.operatingMarkets.map((market) => market.currency));
    },
  };
}
