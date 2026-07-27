/** @module metrics/types */
import type { CampaignId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

/** Raw, cumulative counters recorded for a single campaign. */
export interface MarketingMetricsCounters {
  readonly organizationId: string;
  readonly campaignId: CampaignId;
  readonly impressions: number;
  readonly clicks: number;
  readonly opens: number;
  readonly conversions: number;
  readonly customersAcquired: number;
  readonly cost: string;
  readonly revenue: string;
  readonly updatedAt: ISODateTime;
}

/** Deterministic, derived performance figures computed from the raw counters. */
export interface MarketingMetricsDerived {
  /** Cost per lead: `cost / conversions`. */
  readonly cpl: string;
  /** Customer acquisition cost: `cost / customersAcquired`. */
  readonly cac: string;
  /** Return on investment, as a percentage: `(revenue - cost) / cost * 100`. */
  readonly roi: string;
}

/** The full metrics snapshot returned to callers — raw counters plus derived figures. */
export type MarketingMetricsSnapshot = MarketingMetricsCounters & MarketingMetricsDerived;

/** Additive deltas applied by `recordMetrics()` — every field is optional and defaults to `0`. */
export interface RecordMetricsInput {
  readonly impressions?: number;
  readonly clicks?: number;
  readonly opens?: number;
  readonly conversions?: number;
  readonly customersAcquired?: number;
  readonly cost?: string;
  readonly revenue?: string;
}
