/**
 * Real Marketing Metrics engine — deterministic impressions, clicks,
 * opens, conversions, cost, CPL, CAC, and ROI.
 *
 * @module metrics/engine.impl
 */
import type { MarketingEventBus } from '../events/marketing-event-bus.js';
import { nowIso } from '../shared/id.js';
import type { CampaignId, OrganizationId } from '../shared/identifiers.js';
import type { MarketingMetricsRepository } from './repository.js';
import type { MarketingMetricsCounters, MarketingMetricsDerived, MarketingMetricsSnapshot, RecordMetricsInput } from './types.js';

function parseDecimal(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMoney(value: number): string {
  return value.toFixed(2);
}

/** Pure: CPL, CAC, and ROI derived from raw counters. Every ratio is `0.00` when its denominator is zero. */
export function computeDerivedMetrics(counters: Pick<MarketingMetricsCounters, 'conversions' | 'customersAcquired' | 'cost' | 'revenue'>): MarketingMetricsDerived {
  const cost = parseDecimal(counters.cost);
  const revenue = parseDecimal(counters.revenue);

  const cpl = counters.conversions > 0 ? cost / counters.conversions : 0;
  const cac = counters.customersAcquired > 0 ? cost / counters.customersAcquired : 0;
  const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;

  return { cpl: toMoney(cpl), cac: toMoney(cac), roi: toMoney(roi) };
}

const ZERO_COUNTERS: Omit<MarketingMetricsCounters, 'organizationId' | 'campaignId' | 'updatedAt'> = {
  impressions: 0,
  clicks: 0,
  opens: 0,
  conversions: 0,
  customersAcquired: 0,
  cost: '0.00',
  revenue: '0.00',
};

export interface MarketingMetricsEngine {
  /** Additively records new counter deltas for a campaign and publishes `metrics.updated`. */
  recordMetrics(organizationId: OrganizationId, campaignId: CampaignId, delta: RecordMetricsInput): Promise<MarketingMetricsSnapshot>;
  /** Always returns a snapshot — zeroed counters for a campaign with nothing recorded yet. */
  getMetrics(organizationId: OrganizationId, campaignId: CampaignId): Promise<MarketingMetricsSnapshot>;
  listMetrics(organizationId: OrganizationId): Promise<readonly MarketingMetricsSnapshot[]>;
}

/** Creates a real {@link MarketingMetricsEngine} backed by a {@link MarketingMetricsRepository}. */
export function createMarketingMetricsEngine(
  repository: MarketingMetricsRepository,
  eventBus?: MarketingEventBus,
  now: () => string = nowIso,
): MarketingMetricsEngine {
  function toSnapshot(counters: MarketingMetricsCounters): MarketingMetricsSnapshot {
    return { ...counters, ...computeDerivedMetrics(counters) };
  }

  async function loadOrZero(organizationId: OrganizationId, campaignId: CampaignId): Promise<MarketingMetricsCounters> {
    const existing = await repository.findByCampaign(organizationId, campaignId);
    return existing ?? { organizationId, campaignId, ...ZERO_COUNTERS, updatedAt: now() };
  }

  return {
    async recordMetrics(organizationId, campaignId, delta) {
      const current = await loadOrZero(organizationId, campaignId);
      const updated: MarketingMetricsCounters = {
        organizationId,
        campaignId,
        impressions: current.impressions + (delta.impressions ?? 0),
        clicks: current.clicks + (delta.clicks ?? 0),
        opens: current.opens + (delta.opens ?? 0),
        conversions: current.conversions + (delta.conversions ?? 0),
        customersAcquired: current.customersAcquired + (delta.customersAcquired ?? 0),
        cost: toMoney(parseDecimal(current.cost) + parseDecimal(delta.cost)),
        revenue: toMoney(parseDecimal(current.revenue) + parseDecimal(delta.revenue)),
        updatedAt: now(),
      };
      await repository.save(updated);
      eventBus?.publish('metrics.updated', { campaignId, organizationId });
      return toSnapshot(updated);
    },

    async getMetrics(organizationId, campaignId) {
      const counters = await loadOrZero(organizationId, campaignId);
      return toSnapshot(counters);
    },

    async listMetrics(organizationId) {
      const all = await repository.findAll(organizationId);
      return all.map(toSnapshot);
    },
  };
}
