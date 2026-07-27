/** @module trend/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { TrendResultId } from '../shared/identifiers.js';

export type { TrendResultId };

/** The five deterministic trend granularities supported by the Trend Engine. */
export type TrendGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type TrendDirection = 'up' | 'down' | 'flat';

/** A single input observation to be bucketed by the Trend Engine. */
export interface TrendDataPoint {
  readonly timestamp: string;
  readonly value: number;
}

/** One bucketed period within a computed trend. */
export interface TrendBucket {
  readonly period: string;
  readonly total: number;
  readonly average: number;
  readonly count: number;
}

/** A single, deterministic trend computation. */
export interface TrendResult extends TenantAuditableEntity<TrendResultId> {
  readonly granularity: TrendGranularity;
  readonly buckets: readonly TrendBucket[];
  readonly direction: TrendDirection;
  readonly changePercentage: number;
  readonly computedAt: string;
}
