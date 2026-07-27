/** @module metrics/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { MetricSnapshotId } from '../shared/identifiers.js';

export type { MetricSnapshotId };

/** The seven metric primitives supported by the Metrics Engine. */
export type MetricType = 'counter' | 'gauge' | 'ratio' | 'percentage' | 'trend' | 'moving_average' | 'rolling_average';

/** A single, named metric value at a point in time. */
export interface MetricSnapshot extends TenantAuditableEntity<MetricSnapshotId> {
  readonly metricName: string;
  readonly metricType: MetricType;
  readonly value: number;
  readonly recordedAt: string;
}
