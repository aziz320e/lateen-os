/**
 * Real Marketing Analytics engine — CPL, CAC, ROI, campaign
 * effectiveness, attribution summary, and lead source effectiveness.
 * Composes the real, optional Marketing Engine query port (never a
 * repository). Marketing Engine's own Metrics module already computes
 * CPL/CAC/ROI per campaign, so this engine aggregates those real,
 * per-campaign figures rather than recomputing them.
 *
 * @module marketing-analytics/engine.impl
 */
import type { MarketingRuntime } from '@lateen-os/marketing-engine';
import type { AnalyticsEventBus } from '../events/analytics-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, MarketingAnalyticsId } from '../shared/identifiers.js';
import type { MarketingAnalyticsRepository } from './repository.js';
import type { MarketingAnalyticsSnapshot } from './types.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Pure: the arithmetic mean of a set of numbers, `0` for an empty set. */
export function average(values: readonly number[]): number {
  return values.length === 0 ? 0 : round2(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export interface MarketingAnalyticsDeps {
  readonly marketing?: Pick<MarketingRuntime, 'queries'>;
}

export interface MarketingAnalyticsEngine {
  computeSnapshot(organizationId: OrganizationId): Promise<MarketingAnalyticsSnapshot>;
  get(organizationId: OrganizationId, snapshotId: MarketingAnalyticsId): Promise<MarketingAnalyticsSnapshot | null>;
  list(organizationId: OrganizationId): Promise<readonly MarketingAnalyticsSnapshot[]>;
}

/** Creates a real {@link MarketingAnalyticsEngine} over the optional Marketing Engine collaborator. */
export function createMarketingAnalyticsEngine(
  repository: MarketingAnalyticsRepository,
  deps: MarketingAnalyticsDeps = {},
  eventBus?: AnalyticsEventBus,
  now: () => string = nowIso,
): MarketingAnalyticsEngine {
  return {
    async computeSnapshot(organizationId) {
      let cpl = 0;
      let cac = 0;
      let roi = 0;
      const campaignEffectiveness: Record<string, number> = {};
      const attributionSummary: Record<string, number> = {};
      const leadSourceEffectiveness: Record<string, number> = {};

      if (deps.marketing) {
        const { metrics } = await deps.marketing.queries.findMetrics({ organizationId });
        cpl = average(metrics.map((m) => Number(m.cpl)));
        cac = average(metrics.map((m) => Number(m.cac)));
        roi = average(metrics.map((m) => Number(m.roi)));
        for (const metric of metrics) {
          campaignEffectiveness[metric.campaignId] = round2(Number(metric.roi));
          attributionSummary[metric.campaignId] = metric.conversions;
        }

        const { leads } = await deps.marketing.queries.findLeads({ organizationId });
        const scoresBySource: Record<string, number[]> = {};
        for (const lead of leads) {
          (scoresBySource[lead.source] ??= []).push(lead.score ?? 0);
        }
        for (const [source, scores] of Object.entries(scoresBySource)) {
          leadSourceEffectiveness[source] = average(scores);
        }
      }

      const timestamp = now();
      const snapshot: MarketingAnalyticsSnapshot = {
        id: generateId('marketing-analytics'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        cpl,
        cac,
        roi,
        campaignEffectiveness,
        attributionSummary,
        leadSourceEffectiveness,
        computedAt: timestamp,
      };
      await repository.save(snapshot);
      eventBus?.publish('analytics.snapshot.created', { organizationId, snapshotId: snapshot.id, category: 'marketing' });
      return snapshot;
    },

    async get(organizationId, snapshotId) {
      return repository.findById(organizationId, snapshotId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
