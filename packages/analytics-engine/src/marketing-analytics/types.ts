/** @module marketing-analytics/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { MarketingAnalyticsId } from '../shared/identifiers.js';

export type { MarketingAnalyticsId };

/** A single, deterministic marketing analytics snapshot. */
export interface MarketingAnalyticsSnapshot extends TenantAuditableEntity<MarketingAnalyticsId> {
  readonly cpl: number;
  readonly cac: number;
  readonly roi: number;
  readonly campaignEffectiveness: Readonly<Record<string, number>>;
  readonly attributionSummary: Readonly<Record<string, number>>;
  readonly leadSourceEffectiveness: Readonly<Record<string, number>>;
  readonly computedAt: string;
}
