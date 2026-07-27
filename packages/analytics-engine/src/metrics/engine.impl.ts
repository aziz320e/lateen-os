/**
 * Real Metrics Engine — deterministic counters, gauges, ratios,
 * percentages, trends, moving averages, and rolling averages. Pure
 * calculators are exported independently of the stateful `record*`
 * methods.
 *
 * @module metrics/engine.impl
 */
import type { AnalyticsEventBus } from '../events/analytics-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MetricSnapshotId, OrganizationId } from '../shared/identifiers.js';
import type { MetricSnapshotRepository } from './repository.js';
import type { MetricSnapshot, MetricType } from './types.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Pure: `a / b`, `0` when `b` is `0`. */
export function computeRatio(a: number, b: number): number {
  return b === 0 ? 0 : round2(a / b);
}

/** Pure: `part / whole * 100`, `0` when `whole` is `0`. */
export function computePercentage(part: number, whole: number): number {
  return whole === 0 ? 0 : round2((part / whole) * 100);
}

/** Pure: the average of the last `windowSize` values — a fixed-width moving average. */
export function computeMovingAverage(values: readonly number[], windowSize: number): number {
  if (values.length === 0 || windowSize <= 0) return 0;
  const window = values.slice(-windowSize);
  return round2(window.reduce((sum, value) => sum + value, 0) / window.length);
}

/** Pure: the average of every value seen so far — an expanding-window (cumulative) rolling average. */
export function computeRollingAverage(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return round2(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/** Pure: percentage change from `previous` to `current`, `0` when `previous` is `0`. */
export function computeTrendChange(previous: number, current: number): number {
  return previous === 0 ? 0 : round2(((current - previous) / previous) * 100);
}

export interface MetricsEngine {
  recordCounter(organizationId: OrganizationId, metricName: string, delta: number): Promise<MetricSnapshot>;
  recordGauge(organizationId: OrganizationId, metricName: string, value: number): Promise<MetricSnapshot>;
  recordRatio(organizationId: OrganizationId, metricName: string, a: number, b: number): Promise<MetricSnapshot>;
  recordPercentage(organizationId: OrganizationId, metricName: string, part: number, whole: number): Promise<MetricSnapshot>;
  recordTrend(organizationId: OrganizationId, metricName: string, previous: number, current: number): Promise<MetricSnapshot>;
  recordMovingAverage(organizationId: OrganizationId, metricName: string, values: readonly number[], windowSize: number): Promise<MetricSnapshot>;
  recordRollingAverage(organizationId: OrganizationId, metricName: string, values: readonly number[]): Promise<MetricSnapshot>;
  get(organizationId: OrganizationId, metricSnapshotId: MetricSnapshotId): Promise<MetricSnapshot | null>;
  findByName(organizationId: OrganizationId, metricName: string): Promise<readonly MetricSnapshot[]>;
  findByType(organizationId: OrganizationId, metricType: MetricType): Promise<readonly MetricSnapshot[]>;
}

/** Creates a real {@link MetricsEngine} backed by a {@link MetricSnapshotRepository}. */
export function createMetricsEngine(
  repository: MetricSnapshotRepository,
  eventBus?: AnalyticsEventBus,
  now: () => string = nowIso,
): MetricsEngine {
  async function record(organizationId: OrganizationId, metricName: string, metricType: MetricType, value: number): Promise<MetricSnapshot> {
    const timestamp = now();
    const snapshot: MetricSnapshot = {
      id: generateId('metric-snapshot'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      metricName,
      metricType,
      value,
      recordedAt: timestamp,
    };
    await repository.save(snapshot);
    eventBus?.publish('metric.calculated', { organizationId, metricSnapshotId: snapshot.id, metricName, metricType });
    return snapshot;
  }

  return {
    async recordCounter(organizationId, metricName, delta) {
      const existing = await repository.findByName(organizationId, metricName);
      const counters = existing.filter((snapshot) => snapshot.metricType === 'counter');
      const current = counters.length === 0 ? 0 : counters[counters.length - 1]!.value;
      return record(organizationId, metricName, 'counter', current + delta);
    },
    recordGauge: (organizationId, metricName, value) => record(organizationId, metricName, 'gauge', value),
    recordRatio: (organizationId, metricName, a, b) => record(organizationId, metricName, 'ratio', computeRatio(a, b)),
    recordPercentage: (organizationId, metricName, part, whole) => record(organizationId, metricName, 'percentage', computePercentage(part, whole)),
    recordTrend: (organizationId, metricName, previous, current) => record(organizationId, metricName, 'trend', computeTrendChange(previous, current)),
    recordMovingAverage: (organizationId, metricName, values, windowSize) =>
      record(organizationId, metricName, 'moving_average', computeMovingAverage(values, windowSize)),
    recordRollingAverage: (organizationId, metricName, values) => record(organizationId, metricName, 'rolling_average', computeRollingAverage(values)),

    async get(organizationId, metricSnapshotId) {
      return repository.findById(organizationId, metricSnapshotId);
    },

    async findByName(organizationId, metricName) {
      return repository.findByName(organizationId, metricName);
    },

    async findByType(organizationId, metricType) {
      return repository.findByType(organizationId, metricType);
    },
  };
}
