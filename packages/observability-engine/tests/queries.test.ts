import { describe, expect, it } from 'vitest';
import { createLogEntryRepository } from '../src/logging/repository.impl.js';
import { createMetricSampleRepository } from '../src/metrics/repository.impl.js';
import { createSpanRepository, createTraceRepository } from '../src/tracing/repository.impl.js';
import { createAlertRepository } from '../src/alerting/repository.impl.js';
import { createObservabilitySnapshotRepository } from '../src/snapshot/repository.impl.js';
import { createHealthCheckRepository } from '../src/health/repository.impl.js';
import { createPerformanceSampleRepository } from '../src/performance/repository.impl.js';
import { createObservabilityQueries } from '../src/queries/observability-queries.impl.js';
import { createLoggingEngine } from '../src/logging/engine.impl.js';
import { createMetricsEngine } from '../src/metrics/engine.impl.js';
import { createTracingEngine } from '../src/tracing/engine.impl.js';
import { createAlertEngine } from '../src/alerting/engine.impl.js';
import { createHealthEngine } from '../src/health/engine.impl.js';
import { createPerformanceEngine } from '../src/performance/engine.impl.js';
import { createSnapshotEngine } from '../src/snapshot/engine.impl.js';

const ORG = 'org-1';

function setup() {
  const logEntryRepository = createLogEntryRepository();
  const metricSampleRepository = createMetricSampleRepository();
  const traceRepository = createTraceRepository();
  const spanRepository = createSpanRepository();
  const alertRepository = createAlertRepository();
  const snapshotRepository = createObservabilitySnapshotRepository();
  const healthCheckRepository = createHealthCheckRepository();
  const performanceSampleRepository = createPerformanceSampleRepository();

  const logging = createLoggingEngine(logEntryRepository);
  const metrics = createMetricsEngine(metricSampleRepository);
  const tracing = createTracingEngine(traceRepository, spanRepository);
  const alerts = createAlertEngine(alertRepository, { logging });
  const health = createHealthEngine(healthCheckRepository);
  const performance = createPerformanceEngine(performanceSampleRepository);
  const snapshots = createSnapshotEngine(snapshotRepository);

  const queries = createObservabilityQueries({
    logEntryRepository,
    metricSampleRepository,
    traceRepository,
    alertRepository,
    snapshotRepository,
    healthCheckRepository,
    performanceSampleRepository,
  });

  return { logging, metrics, tracing, alerts, health, performance, snapshots, queries };
}

describe('createObservabilityQueries — findLogs', () => {
  it('finds all logs and filters by level/category', async () => {
    const { logging, queries } = setup();
    await logging.info(ORG, 'a', { category: 'x' });
    await logging.error(ORG, 'b', { category: 'y' });
    expect((await queries.findLogs({ organizationId: ORG })).total).toBe(2);
    expect((await queries.findLogs({ organizationId: ORG, level: 'error' })).total).toBe(1);
    expect((await queries.findLogs({ organizationId: ORG, category: 'x' })).total).toBe(1);
  });

  it('paginates with offset/limit', async () => {
    const { logging, queries } = setup();
    await logging.info(ORG, 'a');
    await logging.info(ORG, 'b');
    await logging.info(ORG, 'c');
    const result = await queries.findLogs({ organizationId: ORG, offset: 1, limit: 1 });
    expect(result.logs).toHaveLength(1);
    expect(result.total).toBe(3);
  });
});

describe('createObservabilityQueries — findMetrics', () => {
  it('finds all metrics and filters by name/type', async () => {
    const { metrics, queries } = setup();
    await metrics.recordGauge(ORG, 'g1', 1);
    await metrics.recordCounter(ORG, 'c1', 1);
    expect((await queries.findMetrics({ organizationId: ORG })).total).toBe(2);
    expect((await queries.findMetrics({ organizationId: ORG, metricName: 'g1' })).total).toBe(1);
    expect((await queries.findMetrics({ organizationId: ORG, metricType: 'counter' })).total).toBe(1);
  });
});

describe('createObservabilityQueries — findTraces', () => {
  it('finds all traces and filters by status', async () => {
    const { tracing, queries } = setup();
    await tracing.startTrace(ORG, 'a');
    const b = await tracing.startTrace(ORG, 'b');
    await tracing.endTrace(ORG, b.id);
    expect((await queries.findTraces({ organizationId: ORG })).total).toBe(2);
    expect((await queries.findTraces({ organizationId: ORG, status: 'completed' })).total).toBe(1);
    expect((await queries.findTraces({ organizationId: ORG, status: 'running' })).total).toBe(1);
  });
});

describe('createObservabilityQueries — findAlerts', () => {
  it('finds all alerts and filters by status/type', async () => {
    const { logging, alerts, queries } = setup();
    await logging.error(ORG, 'e');
    const alert = (await alerts.checkErrorThreshold(ORG, 1))!;
    expect((await queries.findAlerts({ organizationId: ORG })).total).toBe(1);
    expect((await queries.findAlerts({ organizationId: ORG, alertType: 'error_threshold' })).total).toBe(1);
    await alerts.resolve(ORG, alert.id);
    expect((await queries.findAlerts({ organizationId: ORG, status: 'resolved' })).total).toBe(1);
    expect((await queries.findAlerts({ organizationId: ORG, status: 'open' })).total).toBe(0);
  });
});

describe('createObservabilityQueries — findSnapshots', () => {
  it('finds all snapshots and filters by category', async () => {
    const { snapshots, queries } = setup();
    await snapshots.computeSnapshot(ORG, 'runtime');
    await snapshots.computeSnapshot(ORG, 'security');
    expect((await queries.findSnapshots({ organizationId: ORG })).total).toBe(2);
    expect((await queries.findSnapshots({ organizationId: ORG, category: 'security' })).total).toBe(1);
  });
});

describe('createObservabilityQueries — findHealth', () => {
  it('finds all checks and filters by component', async () => {
    const { health, queries } = setup();
    await health.checkComponentHealth(ORG, 'db', 'healthy');
    await health.checkComponentHealth(ORG, 'cache', 'healthy');
    expect((await queries.findHealth({ organizationId: ORG })).total).toBe(2);
    expect((await queries.findHealth({ organizationId: ORG, component: 'db' })).total).toBe(1);
  });
});

describe('createObservabilityQueries — findPerformance', () => {
  it('finds all samples and filters by metric', async () => {
    const { performance, queries } = setup();
    await performance.recordExecutionTime(ORG);
    await performance.recordQueueLatency(ORG);
    expect((await queries.findPerformance({ organizationId: ORG })).total).toBe(2);
    expect((await queries.findPerformance({ organizationId: ORG, metric: 'execution_time' })).total).toBe(1);
  });
});

describe('createObservabilityQueries — empty results', () => {
  it('findMetrics returns an empty result when nothing has been recorded', async () => {
    const { queries } = setup();
    const result = await queries.findMetrics({ organizationId: ORG });
    expect(result).toEqual({ metrics: [], total: 0 });
  });

  it('findTraces returns an empty result when nothing has been recorded', async () => {
    const { queries } = setup();
    const result = await queries.findTraces({ organizationId: ORG });
    expect(result).toEqual({ traces: [], total: 0 });
  });

  it('findAlerts returns an empty result when nothing has been recorded', async () => {
    const { queries } = setup();
    const result = await queries.findAlerts({ organizationId: ORG });
    expect(result).toEqual({ alerts: [], total: 0 });
  });

  it('findSnapshots returns an empty result when nothing has been recorded', async () => {
    const { queries } = setup();
    const result = await queries.findSnapshots({ organizationId: ORG });
    expect(result).toEqual({ snapshots: [], total: 0 });
  });

  it('findHealth returns an empty result when nothing has been recorded', async () => {
    const { queries } = setup();
    const result = await queries.findHealth({ organizationId: ORG });
    expect(result).toEqual({ checks: [], total: 0 });
  });

  it('findPerformance returns an empty result when nothing has been recorded', async () => {
    const { queries } = setup();
    const result = await queries.findPerformance({ organizationId: ORG });
    expect(result).toEqual({ samples: [], total: 0 });
  });
});

describe('createObservabilityQueries — pagination across every method', () => {
  it('findMetrics paginates with offset/limit', async () => {
    const { metrics, queries } = setup();
    await metrics.recordGauge(ORG, 'a', 1);
    await metrics.recordGauge(ORG, 'b', 2);
    await metrics.recordGauge(ORG, 'c', 3);
    const result = await queries.findMetrics({ organizationId: ORG, offset: 1, limit: 1 });
    expect(result.metrics).toHaveLength(1);
    expect(result.total).toBe(3);
  });

  it('findTraces paginates with offset/limit', async () => {
    const { tracing, queries } = setup();
    await tracing.startTrace(ORG, 'a');
    await tracing.startTrace(ORG, 'b');
    const result = await queries.findTraces({ organizationId: ORG, offset: 1, limit: 1 });
    expect(result.traces).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it('findAlerts paginates with offset/limit', async () => {
    const { logging, alerts, queries } = setup();
    await logging.error(ORG, 'e1');
    await logging.warn(ORG, 'w1');
    await alerts.checkErrorThreshold(ORG, 1);
    await alerts.checkWarningThreshold(ORG, 1);
    const result = await queries.findAlerts({ organizationId: ORG, offset: 1, limit: 1 });
    expect(result.alerts).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it('findSnapshots paginates with offset/limit', async () => {
    const { snapshots, queries } = setup();
    await snapshots.computeSnapshot(ORG, 'runtime');
    await snapshots.computeSnapshot(ORG, 'security');
    const result = await queries.findSnapshots({ organizationId: ORG, offset: 1, limit: 1 });
    expect(result.snapshots).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it('findHealth paginates with offset/limit', async () => {
    const { health, queries } = setup();
    await health.checkComponentHealth(ORG, 'a', 'healthy');
    await health.checkComponentHealth(ORG, 'b', 'healthy');
    const result = await queries.findHealth({ organizationId: ORG, offset: 1, limit: 1 });
    expect(result.checks).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it('findPerformance paginates with offset/limit', async () => {
    const { performance, queries } = setup();
    await performance.recordExecutionTime(ORG);
    await performance.recordQueueLatency(ORG);
    const result = await queries.findPerformance({ organizationId: ORG, offset: 1, limit: 1 });
    expect(result.samples).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it('searchObservability respects a limit', async () => {
    const { logging, queries } = setup();
    await logging.info(ORG, 'zzz-keyword');
    await logging.info(ORG, 'zzz-keyword again');
    await logging.info(ORG, 'zzz-keyword once more');
    const result = await queries.searchObservability({ organizationId: ORG, keyword: 'zzz-keyword', limit: 2 });
    expect(result.matches).toHaveLength(2);
    expect(result.total).toBe(3);
  });
});

describe('createObservabilityQueries — searchObservability', () => {
  it('ranks an exact-match record above substring matches', async () => {
    const { logging, queries } = setup();
    await logging.info(ORG, 'database');
    await logging.info(ORG, 'database connection pool exhausted');

    const result = await queries.searchObservability({ organizationId: ORG, keyword: 'database' });
    expect(result.total).toBe(2);
    expect(result.matches[0]!.score).toBe(3);
    expect(result.matches[0]!.label).toBe('database');
  });

  it('matches records across logs, traces, and health checks by their own label', async () => {
    const { logging, tracing, health, queries } = setup();
    await logging.error(ORG, 'search-term-x');
    await tracing.startTrace(ORG, 'search-term-x');
    await health.checkComponentHealth(ORG, 'search-term-x', 'healthy');

    const result = await queries.searchObservability({ organizationId: ORG, keyword: 'search-term-x' });
    expect(new Set(result.matches.map((m) => m.recordType))).toEqual(new Set(['log', 'trace', 'health']));
  });

  it('matches an alert by its generated message', async () => {
    const { logging, alerts, queries } = setup();
    await logging.error(ORG, 'e');
    const alert = (await alerts.checkErrorThreshold(ORG, 1))!;

    const result = await queries.searchObservability({ organizationId: ORG, keyword: alert.message });
    expect(result.matches.some((m) => m.recordType === 'alert' && m.id === alert.id)).toBe(true);
  });

  it('returns no matches for an unrelated keyword', async () => {
    const { queries } = setup();
    const result = await queries.searchObservability({ organizationId: ORG, keyword: 'zzz-no-match' });
    expect(result.matches).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('is case-insensitive', async () => {
    const { logging, queries } = setup();
    await logging.info(ORG, 'Database');
    const result = await queries.searchObservability({ organizationId: ORG, keyword: 'database' });
    expect(result.total).toBe(1);
  });

  it('breaks ties between equal-score matches by id ascending', async () => {
    const { logging, queries } = setup();
    await logging.info(ORG, 'tie-break-keyword');
    await logging.info(ORG, 'tie-break-keyword');
    const result = await queries.searchObservability({ organizationId: ORG, keyword: 'tie-break-keyword' });
    expect(result.matches[0]!.id < result.matches[1]!.id).toBe(true);
  });
});

describe('createObservabilityQueries — organization scoping', () => {
  it('findLogs only returns entries for the requested organization', async () => {
    const { logging, queries } = setup();
    await logging.info(ORG, 'a');
    await logging.info('org-2', 'b');
    expect((await queries.findLogs({ organizationId: ORG })).total).toBe(1);
  });

  it('findAlerts only returns alerts for the requested organization', async () => {
    const { logging, alerts, queries } = setup();
    await logging.error(ORG, 'e');
    await alerts.checkErrorThreshold(ORG, 1);
    expect((await queries.findAlerts({ organizationId: 'org-2' })).total).toBe(0);
  });
});
