/**
 * Real Metrics Collector engine — counters, gauges, histograms, timers,
 * and moving averages.
 *
 * @module metrics/engine.impl
 */
import type { ObservabilityEventBus } from '../events/observability-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MetricSampleId, OrganizationId } from '../shared/identifiers.js';
import type { MetricSampleRepository } from './repository.js';
import type { MetricSample } from './types.js';

/** Fixed-width moving average over the *last* `windowSize` values. */
export function computeMovingAverage(values: readonly number[], windowSize: number): number {
  if (values.length === 0 || windowSize <= 0) return 0;
  const window = values.slice(-windowSize);
  return window.reduce((sum, value) => sum + value, 0) / window.length;
}

export interface HistogramStats {
  readonly count: number;
  readonly sum: number;
  readonly average: number;
  readonly min: number;
  readonly max: number;
}

/** Deterministic summary statistics over a set of histogram observations. */
export function computeHistogramStats(values: readonly number[]): HistogramStats {
  if (values.length === 0) {
    return { count: 0, sum: 0, average: 0, min: 0, max: 0 };
  }
  const sum = values.reduce((total, value) => total + value, 0);
  return {
    count: values.length,
    sum,
    average: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/** Most-recently-recorded sample for a metric name, favoring the latest insert on a timestamp tie. */
function latestByName(samples: readonly MetricSample[], metricName: string): MetricSample | null {
  const matching = samples.filter((sample) => sample.metricName === metricName);
  if (matching.length === 0) return null;
  return [...matching].reverse().sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0]!;
}

export interface MetricsEngine {
  recordCounter(organizationId: OrganizationId, metricName: string, delta: number, tags?: Readonly<Record<string, string>>): Promise<MetricSample>;
  recordGauge(organizationId: OrganizationId, metricName: string, value: number, tags?: Readonly<Record<string, string>>): Promise<MetricSample>;
  recordHistogram(organizationId: OrganizationId, metricName: string, value: number, tags?: Readonly<Record<string, string>>): Promise<MetricSample>;
  recordTimer(organizationId: OrganizationId, metricName: string, durationMs: number, tags?: Readonly<Record<string, string>>): Promise<MetricSample>;
  get(organizationId: OrganizationId, metricSampleId: MetricSampleId): Promise<MetricSample | null>;
  list(organizationId: OrganizationId): Promise<readonly MetricSample[]>;
}

/** Creates a real {@link MetricsEngine} over the given repository. */
export function createMetricsEngine(
  repository: MetricSampleRepository,
  eventBus?: ObservabilityEventBus,
  now: () => string = nowIso,
): MetricsEngine {
  async function record(
    organizationId: OrganizationId,
    metricName: string,
    metricType: MetricSample['metricType'],
    value: number,
    tags?: Readonly<Record<string, string>>,
  ): Promise<MetricSample> {
    const timestamp = now();
    const sample: MetricSample = {
      id: generateId('metric-sample'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      metricName,
      metricType,
      value,
      tags,
      recordedAt: timestamp,
    };
    await repository.save(sample);
    eventBus?.publish('metric.updated', { organizationId, metricSampleId: sample.id, metricName, metricType });
    return sample;
  }

  return {
    async recordCounter(organizationId, metricName, delta, tags) {
      const existing = await repository.findByName(organizationId, metricName);
      const previous = latestByName(existing, metricName);
      const cumulative = (previous?.value ?? 0) + delta;
      return record(organizationId, metricName, 'counter', cumulative, tags);
    },

    async recordGauge(organizationId, metricName, value, tags) {
      return record(organizationId, metricName, 'gauge', value, tags);
    },

    async recordHistogram(organizationId, metricName, value, tags) {
      return record(organizationId, metricName, 'histogram', value, tags);
    },

    async recordTimer(organizationId, metricName, durationMs, tags) {
      return record(organizationId, metricName, 'timer', durationMs, tags);
    },

    async get(organizationId, metricSampleId) {
      return repository.findById(organizationId, metricSampleId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
