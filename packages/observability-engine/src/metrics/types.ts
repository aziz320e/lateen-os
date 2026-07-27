/** @module metrics/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { MetricSampleId } from '../shared/identifiers.js';

export type { MetricSampleId };

/** The four deterministic metric primitives supported by the Metrics Collector. */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer';

/** A single, immutable metric sample. */
export interface MetricSample extends TenantAuditableEntity<MetricSampleId> {
  readonly metricName: string;
  readonly metricType: MetricType;
  readonly value: number;
  readonly tags?: Readonly<Record<string, string>>;
  readonly recordedAt: string;
}
