/** Real, in-memory {@link MarketingMetricsRepository} implementation. Keyed by `(organizationId, campaignId)`, not `id`. @module metrics/repository.impl */
import type { MarketingMetricsRepository } from './repository.js';
import type { MarketingMetricsCounters } from './types.js';

function scopeKey(organizationId: string, campaignId: string): string {
  return `${organizationId}::${campaignId}`;
}

/** Creates a real, in-memory {@link MarketingMetricsRepository}. */
export function createMarketingMetricsRepository(seed?: readonly MarketingMetricsCounters[]): MarketingMetricsRepository {
  const store = new Map<string, MarketingMetricsCounters>();
  for (const counters of seed ?? []) store.set(scopeKey(counters.organizationId, counters.campaignId), counters);

  return {
    async save(counters) {
      store.set(scopeKey(counters.organizationId, counters.campaignId), counters);
    },
    async findByCampaign(organizationId, campaignId) {
      return store.get(scopeKey(organizationId, campaignId)) ?? null;
    },
    async findAll(organizationId) {
      return [...store.values()].filter((counters) => counters.organizationId === organizationId);
    },
  };
}
