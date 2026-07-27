import { describe, expect, it, vi } from 'vitest';
import { createObservabilityEventBus } from '../src/events/observability-event-bus.js';
import { createMetricSampleRepository } from '../src/metrics/repository.impl.js';
import { computeHistogramStats, computeMovingAverage, createMetricsEngine } from '../src/metrics/engine.impl.js';

const ORG = 'org-1';

describe('computeMovingAverage (pure)', () => {
  it('averages the last N values only', () => {
    expect(computeMovingAverage([1, 2, 3, 4, 5], 2)).toBe(4.5);
  });

  it('averages all values when windowSize exceeds length', () => {
    expect(computeMovingAverage([1, 2, 3], 10)).toBe(2);
  });

  it('returns 0 for an empty array', () => {
    expect(computeMovingAverage([], 3)).toBe(0);
  });

  it('returns 0 for a non-positive window size', () => {
    expect(computeMovingAverage([1, 2, 3], 0)).toBe(0);
  });
});

describe('computeHistogramStats (pure)', () => {
  it('computes count/sum/average/min/max', () => {
    expect(computeHistogramStats([1, 2, 3, 4])).toEqual({ count: 4, sum: 10, average: 2.5, min: 1, max: 4 });
  });

  it('returns zeroed stats for an empty array', () => {
    expect(computeHistogramStats([])).toEqual({ count: 0, sum: 0, average: 0, min: 0, max: 0 });
  });
});

function setup() {
  const repository = createMetricSampleRepository();
  const eventBus = createObservabilityEventBus();
  const engine = createMetricsEngine(repository, eventBus);
  return { repository, eventBus, engine };
}

describe('createMetricsEngine — recordCounter', () => {
  it('is cumulative across calls', async () => {
    const { engine } = setup();
    await engine.recordCounter(ORG, 'requests', 5);
    const second = await engine.recordCounter(ORG, 'requests', 3);
    expect(second.value).toBe(8);
  });

  it('starts from 0 for a new metric name', async () => {
    const { engine } = setup();
    const sample = await engine.recordCounter(ORG, 'new-metric', 4);
    expect(sample.value).toBe(4);
  });

  it('is independent per metric name', async () => {
    const { engine } = setup();
    await engine.recordCounter(ORG, 'a', 10);
    const b = await engine.recordCounter(ORG, 'b', 1);
    expect(b.value).toBe(1);
  });
});

describe('createMetricsEngine — recordGauge / recordHistogram / recordTimer', () => {
  it('recordGauge records the given absolute value', async () => {
    const { engine } = setup();
    const sample = await engine.recordGauge(ORG, 'temp', 42);
    expect(sample.value).toBe(42);
    expect(sample.metricType).toBe('gauge');
  });

  it('recordHistogram records the given observation', async () => {
    const { engine } = setup();
    const sample = await engine.recordHistogram(ORG, 'latency', 120);
    expect(sample.value).toBe(120);
    expect(sample.metricType).toBe('histogram');
  });

  it('recordTimer records the given duration', async () => {
    const { engine } = setup();
    const sample = await engine.recordTimer(ORG, 'query', 55);
    expect(sample.value).toBe(55);
    expect(sample.metricType).toBe('timer');
  });

  it('accepts optional tags', async () => {
    const { engine } = setup();
    const sample = await engine.recordGauge(ORG, 'temp', 1, { region: 'us' });
    expect(sample.tags).toEqual({ region: 'us' });
  });
});

describe('createMetricsEngine — event publishing', () => {
  it('publishes metric.updated on every record', async () => {
    const { engine, eventBus } = setup();
    const handler = vi.fn();
    eventBus.subscribe('metric.updated', handler);
    const sample = await engine.recordGauge(ORG, 'g', 1);
    expect(handler).toHaveBeenCalledWith(
      { organizationId: ORG, metricSampleId: sample.id, metricName: 'g', metricType: 'gauge' },
      expect.anything(),
    );
  });
});

describe('createMetricsEngine — get / list / org scoping', () => {
  it('get() returns null for an unknown sample', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every recorded sample', async () => {
    const { engine } = setup();
    await engine.recordGauge(ORG, 'a', 1);
    await engine.recordGauge(ORG, 'b', 2);
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const sample = await engine.recordGauge(ORG, 'g', 1);
    expect(await repository.findById('org-2', sample.id)).toBeNull();
  });
});

describe('createMetricSampleRepository — query helpers', () => {
  it('findByName filters by metric name', async () => {
    const { engine, repository } = setup();
    await engine.recordGauge(ORG, 'a', 1);
    await engine.recordGauge(ORG, 'b', 2);
    expect(await repository.findByName(ORG, 'a')).toHaveLength(1);
  });

  it('findByType filters by metric type', async () => {
    const { engine, repository } = setup();
    await engine.recordGauge(ORG, 'a', 1);
    await engine.recordCounter(ORG, 'b', 1);
    expect(await repository.findByType(ORG, 'counter')).toHaveLength(1);
  });

  it('findByName returns an empty array when no sample matches', async () => {
    const { repository } = setup();
    expect(await repository.findByName(ORG, 'missing')).toEqual([]);
  });

  it('findByType returns an empty array when no sample matches', async () => {
    const { repository } = setup();
    expect(await repository.findByType(ORG, 'histogram')).toEqual([]);
  });
});

describe('computeMovingAverage / computeHistogramStats — additional pure cases', () => {
  it('computeMovingAverage handles a window of exactly 1', () => {
    expect(computeMovingAverage([1, 2, 3], 1)).toBe(3);
  });

  it('computeMovingAverage handles negative values', () => {
    expect(computeMovingAverage([-2, -4], 2)).toBe(-3);
  });

  it('computeHistogramStats handles a single observation', () => {
    expect(computeHistogramStats([7])).toEqual({ count: 1, sum: 7, average: 7, min: 7, max: 7 });
  });

  it('computeHistogramStats handles negative and positive values', () => {
    expect(computeHistogramStats([-5, 5])).toEqual({ count: 2, sum: 0, average: 0, min: -5, max: 5 });
  });
});

describe('createMetricsEngine — additional coverage', () => {
  it('recordCounter accumulates across three sequential calls', async () => {
    const { engine } = setup();
    await engine.recordCounter(ORG, 'hits', 1);
    await engine.recordCounter(ORG, 'hits', 1);
    const third = await engine.recordCounter(ORG, 'hits', 1);
    expect(third.value).toBe(3);
  });

  it('accepts an injectable now() clock', async () => {
    const fixed = '2026-03-01T00:00:00.000Z';
    const repository = createMetricSampleRepository();
    const engine = createMetricsEngine(repository, undefined, () => fixed);
    const sample = await engine.recordGauge(ORG, 'g', 1);
    expect(sample.recordedAt).toBe(fixed);
  });

  it('list() returns an empty array for an organization with no samples', async () => {
    const { engine } = setup();
    expect(await engine.list(ORG)).toEqual([]);
  });

  it('each recorded sample has a distinct id', async () => {
    const { engine } = setup();
    const a = await engine.recordGauge(ORG, 'g', 1);
    const b = await engine.recordGauge(ORG, 'g', 2);
    expect(a.id).not.toBe(b.id);
  });

  it('get() returns a previously recorded sample', async () => {
    const { engine } = setup();
    const sample = await engine.recordTimer(ORG, 't', 10);
    expect(await engine.get(ORG, sample.id)).toEqual(sample);
  });

  it('recordCounter with a delta of 0 leaves the value unchanged', async () => {
    const { engine } = setup();
    await engine.recordCounter(ORG, 'c', 5);
    const second = await engine.recordCounter(ORG, 'c', 0);
    expect(second.value).toBe(5);
  });

  it('gauges are not cumulative — each call records the given absolute value', async () => {
    const { engine } = setup();
    await engine.recordGauge(ORG, 'g', 100);
    const second = await engine.recordGauge(ORG, 'g', 5);
    expect(second.value).toBe(5);
  });
});
