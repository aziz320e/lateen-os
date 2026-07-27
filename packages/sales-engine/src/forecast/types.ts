/** @module forecast/types */
import type { ForecastSnapshotId } from '../shared/identifiers.js';

export type { ForecastSnapshotId };

/** A single calendar-month bucket within a forecast snapshot. */
export interface MonthlyForecastBucket {
  /** `YYYY-MM`, or `'unscheduled'` for opportunities with no `expectedCloseDate`. */
  readonly month: string;
  readonly totalAmount: string;
  readonly weightedAmount: string;
  readonly opportunityCount: number;
}

/** A deterministic, point-in-time snapshot of the weighted sales pipeline. */
export interface ForecastSnapshot {
  readonly id: ForecastSnapshotId;
  readonly organizationId: string;
  readonly generatedAt: string;
  readonly totalOpenAmount: string;
  readonly weightedPipelineValue: string;
  readonly opportunityCount: number;
  readonly monthlyForecast: readonly MonthlyForecastBucket[];
}
