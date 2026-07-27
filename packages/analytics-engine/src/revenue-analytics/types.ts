/** @module revenue-analytics/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { RevenueAnalyticsId } from '../shared/identifiers.js';

export type { RevenueAnalyticsId };

/** A single, deterministic revenue analytics snapshot computed as of a reference date. */
export interface RevenueAnalyticsSnapshot extends TenantAuditableEntity<RevenueAnalyticsId> {
  readonly asOf: string;
  readonly mrr: number;
  readonly arr: number;
  readonly monthlyRevenue: number;
  readonly quarterlyRevenue: number;
  readonly yearlyRevenue: number;
  readonly growthPercentage: number;
  readonly revenueByProduct: Readonly<Record<string, number>>;
  readonly revenueByMarket: Readonly<Record<string, number>>;
  readonly computedAt: string;
}
