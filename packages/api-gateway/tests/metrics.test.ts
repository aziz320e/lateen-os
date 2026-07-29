import { describe, expect, it } from 'vitest';
import { computeAverageDurationMs, computeErrorRate, createMetricsEngine } from '../src/metrics/engine.impl.js';
import { createHealthSnapshotRepository, createRequestMetricRepository } from '../src/metrics/repository.impl.js';
import type { RequestMetric } from '../src/metrics/types.js';

const ORG = 'org-1';

function setup() {
  return { engine: createMetricsEngine(createRequestMetricRepository(), createHealthSnapshotRepository()) };
}

function makeMetric(overrides: Partial<RequestMetric> = {}): RequestMetric {
  return {
    id: 'metric-x',
    organizationId: ORG,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    correlationId: 'corr-x',
    method: 'GET',
    path: '/x',
    statusCode: 200,
    durationMs: 100,
    ...overrides,
  };
}

describe('computeAverageDurationMs (pure)', () => {
  it('returns 0 for an empty list', () => {
    expect(computeAverageDurationMs([])).toBe(0);
  });

  it('averages and rounds durations', () => {
    const metrics = [makeMetric({ durationMs: 100 }), makeMetric({ durationMs: 101 })];
    expect(computeAverageDurationMs(metrics)).toBe(101);
  });
});

describe('computeErrorRate (pure)', () => {
  it('returns 0 for an empty list', () => {
    expect(computeErrorRate([])).toBe(0);
  });

  it('computes the fraction of statusCode >= 400 requests', () => {
    const metrics = [makeMetric({ statusCode: 200 }), makeMetric({ statusCode: 500 }), makeMetric({ statusCode: 404 }), makeMetric({ statusCode: 200 })];
    expect(computeErrorRate(metrics)).toBe(0.5);
  });

  it('a fully healthy set of metrics has a 0 error rate', () => {
    expect(computeErrorRate([makeMetric({ statusCode: 200 }), makeMetric({ statusCode: 201 })])).toBe(0);
  });
});

describe('MetricsEngine — Request Metrics', () => {
  it('recordRequestMetric() persists a metric record', async () => {
    const { engine } = setup();
    const metric = await engine.recordRequestMetric(ORG, { correlationId: 'corr-1', method: 'GET', path: '/crm/customers', statusCode: 200, durationMs: 50 });
    expect(metric.durationMs).toBe(50);
  });

  it('computeAverageDurationForPath() filters by path when given', async () => {
    const { engine } = setup();
    await engine.recordRequestMetric(ORG, { correlationId: 'c1', method: 'GET', path: '/a', statusCode: 200, durationMs: 100 });
    await engine.recordRequestMetric(ORG, { correlationId: 'c2', method: 'GET', path: '/b', statusCode: 200, durationMs: 200 });
    expect(await engine.computeAverageDurationForPath(ORG, '/a')).toBe(100);
    expect(await engine.computeAverageDurationForPath(ORG)).toBe(150);
  });

  it('computeErrorRateOverall() aggregates across every recorded metric', async () => {
    const { engine } = setup();
    await engine.recordRequestMetric(ORG, { correlationId: 'c1', method: 'GET', path: '/a', statusCode: 500, durationMs: 10 });
    await engine.recordRequestMetric(ORG, { correlationId: 'c2', method: 'GET', path: '/a', statusCode: 200, durationMs: 10 });
    expect(await engine.computeErrorRateOverall(ORG)).toBe(0.5);
  });

  it('findMetricsByPath() / listMetrics() work as expected', async () => {
    const { engine } = setup();
    await engine.recordRequestMetric(ORG, { correlationId: 'c1', method: 'GET', path: '/a', statusCode: 200, durationMs: 10 });
    expect(await engine.findMetricsByPath(ORG, '/a')).toHaveLength(1);
    expect(await engine.listMetrics(ORG)).toHaveLength(1);
  });
});

describe('MetricsEngine — Health Endpoints', () => {
  it('recordHealthCheck() persists a snapshot', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordHealthCheck(ORG, { serviceName: 'crm-engine', healthy: true });
    expect(snapshot.healthy).toBe(true);
  });

  it('getLatestServiceHealth() returns the most recently checked snapshot for a service', async () => {
    let current = '2026-01-01T00:00:00.000Z';
    const engine = createMetricsEngine(createRequestMetricRepository(), createHealthSnapshotRepository(), () => current);
    await engine.recordHealthCheck(ORG, { serviceName: 'crm-engine', healthy: false });
    current = '2026-01-01T00:01:00.000Z';
    await engine.recordHealthCheck(ORG, { serviceName: 'crm-engine', healthy: true });
    const latest = await engine.getLatestServiceHealth(ORG, 'crm-engine');
    expect(latest?.healthy).toBe(true);
  });

  it('getLatestServiceHealth() returns null when no checks have run for a service', async () => {
    const { engine } = setup();
    expect(await engine.getLatestServiceHealth(ORG, 'unknown-service')).toBeNull();
  });

  it('getOverallHealth() is healthy when every service’s latest snapshot is healthy', async () => {
    const { engine } = setup();
    await engine.recordHealthCheck(ORG, { serviceName: 'crm-engine', healthy: true });
    await engine.recordHealthCheck(ORG, { serviceName: 'finance-engine', healthy: true });
    const health = await engine.getOverallHealth(ORG);
    expect(health).toEqual({ healthy: true, checkedServices: 2, unhealthyServices: [] });
  });

  it('getOverallHealth() reports unhealthy services by name', async () => {
    const { engine } = setup();
    await engine.recordHealthCheck(ORG, { serviceName: 'crm-engine', healthy: true });
    await engine.recordHealthCheck(ORG, { serviceName: 'finance-engine', healthy: false });
    const health = await engine.getOverallHealth(ORG);
    expect(health.healthy).toBe(false);
    expect(health.unhealthyServices).toEqual(['finance-engine']);
  });

  it('getOverallHealth() only considers each service’s latest snapshot', async () => {
    let current = '2026-01-01T00:00:00.000Z';
    const engine = createMetricsEngine(createRequestMetricRepository(), createHealthSnapshotRepository(), () => current);
    await engine.recordHealthCheck(ORG, { serviceName: 'crm-engine', healthy: false });
    current = '2026-01-01T00:01:00.000Z';
    await engine.recordHealthCheck(ORG, { serviceName: 'crm-engine', healthy: true });
    const health = await engine.getOverallHealth(ORG);
    expect(health.healthy).toBe(true);
  });

  it('listHealthSnapshots() returns every snapshot recorded', async () => {
    const { engine } = setup();
    await engine.recordHealthCheck(ORG, { serviceName: 'crm-engine', healthy: true });
    await engine.recordHealthCheck(ORG, { serviceName: 'crm-engine', healthy: false });
    expect(await engine.listHealthSnapshots(ORG)).toHaveLength(2);
  });

  it('getOverallHealth() is healthy with 0 checked services when nothing has ever been recorded', async () => {
    const { engine } = setup();
    expect(await engine.getOverallHealth(ORG)).toEqual({ healthy: true, checkedServices: 0, unhealthyServices: [] });
  });

  it('computeAverageDurationMs rounds a single metric to its own duration', () => {
    expect(computeAverageDurationMs([makeMetric({ durationMs: 77 })])).toBe(77);
  });

  it('computeErrorRate is 1 when every recorded request errored', () => {
    expect(computeErrorRate([makeMetric({ statusCode: 500 }), makeMetric({ statusCode: 502 })])).toBe(1);
  });

  it('findMetricsByPath() returns an empty array for a path with no recorded metrics', async () => {
    const { engine } = setup();
    await engine.recordRequestMetric(ORG, { correlationId: 'c1', method: 'GET', path: '/a', statusCode: 200, durationMs: 10 });
    expect(await engine.findMetricsByPath(ORG, '/b')).toEqual([]);
  });

  it('recordRequestMetric() and health checks are isolated per organization', async () => {
    const { engine } = setup();
    await engine.recordRequestMetric(ORG, { correlationId: 'c1', method: 'GET', path: '/a', statusCode: 200, durationMs: 10 });
    await engine.recordHealthCheck(ORG, { serviceName: 'crm-engine', healthy: true });
    expect(await engine.listMetrics('org-2')).toEqual([]);
    expect(await engine.listHealthSnapshots('org-2')).toEqual([]);
  });

  it('getLatestServiceHealth() distinguishes between two different services', async () => {
    const { engine } = setup();
    await engine.recordHealthCheck(ORG, { serviceName: 'crm-engine', healthy: true });
    await engine.recordHealthCheck(ORG, { serviceName: 'finance-engine', healthy: false });
    expect((await engine.getLatestServiceHealth(ORG, 'crm-engine'))?.healthy).toBe(true);
    expect((await engine.getLatestServiceHealth(ORG, 'finance-engine'))?.healthy).toBe(false);
  });

  it('recordRequestMetric() preserves the requested method and path', async () => {
    const { engine } = setup();
    const metric = await engine.recordRequestMetric(ORG, { correlationId: 'corr-1', method: 'DELETE', path: '/crm/customers/1', statusCode: 204, durationMs: 5 });
    expect(metric.method).toBe('DELETE');
    expect(metric.path).toBe('/crm/customers/1');
  });

  it('computeAverageDurationMs rounds .5 up consistently', () => {
    expect(computeAverageDurationMs([makeMetric({ durationMs: 1 }), makeMetric({ durationMs: 2 })])).toBe(2);
  });
});
