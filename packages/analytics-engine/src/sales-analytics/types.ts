/** @module sales-analytics/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { SalesAnalyticsId } from '../shared/identifiers.js';

export type { SalesAnalyticsId };

/** A single, deterministic sales analytics snapshot. */
export interface SalesAnalyticsSnapshot extends TenantAuditableEntity<SalesAnalyticsId> {
  readonly pipelineValue: number;
  readonly funnel: Readonly<Record<string, number>>;
  readonly averageStageDurationDays: Readonly<Record<string, number>>;
  readonly closeRate: number;
  readonly averageDealSize: number;
  readonly averageSalesCycleDays: number;
  readonly salesVelocity: number;
  readonly computedAt: string;
}
