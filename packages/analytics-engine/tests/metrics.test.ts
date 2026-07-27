import { describe, expect, it } from 'vitest';
import { createMetricSnapshotRepository } from '../src/metrics/repository.impl.js';
import {
  computeMovingAverage,
  computePercentage,
  computeRatio,
  computeRollingAverage,
  computeTrendChange,
  createMetricsEngine,
} from '../src/metrics/engine.impl.js';
import { createAnalyticsEventBus } from '../src/events/index.js';

const ORG = 'org-1';

describe('Metrics pure calculators', () => {
  it('computeRatio() divides a by b, 0 for zero denominator', () => {
    expect(computeRatio(10, 4)).toBe(2.5);
    expect(computeRatio(10, 0)).toBe(0);
  });

  it('computePercentage() computes part/whole*100', () => {
    expect(computePercentage(25, 200)).toBe(12.5);
    expect(computePercentage(1, 0)).toBe(0);
  });

  it('computeMovingAverage() averages the last windowSize values', () => {
    expect(computeMovingAverage([1, 2, 3, 4, 5], 2)).toBe(4.5);
  });

  it('computeMovingAverage() returns 0 for an empty array', () => {
    expect(computeMovingAverage([], 3)).toBe(0);
  });

  it('computeRollingAverage() averages every value seen', () => {
    expect(computeRollingAverage([1, 2, 3, 4])).toBe(2.5);
  });

  it('computeRollingAverage() returns 0 for an empty array', () => {
    expect(computeRollingAverage([])).toBe(0);
  });

  it('computeTrendChange() computes percentage change, 0 for zero previous', () => {
    expect(computeTrendChange(100, 150)).toBe(50);
    expect(computeTrendChange(0, 150)).toBe(0);
  });
});

function setup(eventBus = createAnalyticsEventBus()) {
  const repository = createMetricSnapshotRepository();
  const engine = createMetricsEngine(repository, eventBus);
  return { repository, engine, eventBus };
}

describe('createMetricsEngine — recordCounter', () => {
  it('starts at the given delta for a new counter', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordCounter(ORG, 'signups', 5);
    expect(snapshot.value).toBe(5);
  });

  it('accumulates across calls', async () => {
    const { engine } = setup();
    await engine.recordCounter(ORG, 'signups', 5);
    const second = await engine.recordCounter(ORG, 'signups', 3);
    expect(second.value).toBe(8);
  });
});

describe('createMetricsEngine — other record* methods', () => {
  it('recordGauge() records the absolute value', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordGauge(ORG, 'active-sessions', 42);
    expect(snapshot.value).toBe(42);
    expect(snapshot.metricType).toBe('gauge');
  });

  it('recordRatio() computes and records the ratio', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordRatio(ORG, 'signal-to-noise', 10, 5);
    expect(snapshot.value).toBe(2);
  });

  it('recordPercentage() computes and records the percentage', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordPercentage(ORG, 'completion', 3, 4);
    expect(snapshot.value).toBe(75);
  });

  it('recordTrend() computes and records the percentage change', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordTrend(ORG, 'revenue-trend', 100, 120);
    expect(snapshot.value).toBe(20);
  });

  it('recordMovingAverage() computes and records the moving average', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordMovingAverage(ORG, 'latency', [10, 20, 30], 2);
    expect(snapshot.value).toBe(25);
  });

  it('recordRollingAverage() computes and records the rolling average', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordRollingAverage(ORG, 'latency', [10, 20, 30]);
    expect(snapshot.value).toBe(20);
  });

  it('every record* method publishes metric.calculated', async () => {
    const eventBus = createAnalyticsEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('metric.calculated', (payload) => (seen = payload));
    const snapshot = await engine.recordGauge(ORG, 'active-sessions', 10);
    expect(seen).toEqual({ organizationId: ORG, metricSnapshotId: snapshot.id, metricName: 'active-sessions', metricType: 'gauge' });
  });
});

describe('createMetricsEngine — get / findByName / findByType / org scoping', () => {
  it('get() returns null for an unknown snapshot', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('findByName() filters correctly', async () => {
    const { engine } = setup();
    await engine.recordGauge(ORG, 'metric-a', 1);
    await engine.recordGauge(ORG, 'metric-b', 2);
    const results = await engine.findByName(ORG, 'metric-a');
    expect(results).toHaveLength(1);
  });

  it('findByType() filters correctly', async () => {
    const { engine } = setup();
    await engine.recordGauge(ORG, 'metric-a', 1);
    await engine.recordCounter(ORG, 'metric-b', 1);
    const gauges = await engine.findByType(ORG, 'gauge');
    expect(gauges).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const snapshot = await engine.recordGauge(ORG, 'metric-a', 1);
    expect(await repository.findById('org-2', snapshot.id)).toBeNull();
  });
});
