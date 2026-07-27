/** @module performance/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { PerformanceSampleId } from '../shared/identifiers.js';

export type { PerformanceSampleId };

/** The five deterministic performance metrics supported by the Performance Engine. */
export type PerformanceMetric = 'execution_time' | 'queue_latency' | 'workflow_duration' | 'message_throughput' | 'runtime_utilization';

export type PerformanceUnit = 'ms' | 'per_minute' | 'percentage';

/** A single, deterministic performance sample. */
export interface PerformanceSample extends TenantAuditableEntity<PerformanceSampleId> {
  readonly metric: PerformanceMetric;
  readonly value: number;
  readonly unit: PerformanceUnit;
  readonly context?: Readonly<Record<string, unknown>>;
  readonly recordedAt: string;
}
