/**
 * Real {@link ObservabilityQueries} implementation — a CQRS read layer
 * composed over the Observability Platform repositories. Repositories
 * are taken as constructor dependencies but never returned to callers.
 *
 * @module queries/observability-queries.impl
 */
import type { AlertRepository } from '../alerting/repository.js';
import type { HealthCheckRepository } from '../health/repository.js';
import type { LogEntryRepository } from '../logging/repository.js';
import type { MetricSampleRepository } from '../metrics/repository.js';
import type { PerformanceSampleRepository } from '../performance/repository.js';
import type { ObservabilitySnapshotRepository } from '../snapshot/repository.js';
import type { TraceRepository } from '../tracing/repository.js';
import type { ObservabilityQueries } from './observability-queries.js';
import type {
  FindAlertsQuery,
  FindAlertsResult,
  FindHealthQuery,
  FindHealthResult,
  FindLogsQuery,
  FindLogsResult,
  FindMetricsQuery,
  FindMetricsResult,
  FindPerformanceQuery,
  FindPerformanceResult,
  FindSnapshotsQuery,
  FindSnapshotsResult,
  FindTracesQuery,
  FindTracesResult,
  SearchObservabilityMatch,
  SearchObservabilityQuery,
  SearchObservabilityResult,
} from './types.js';

export interface ObservabilityQueriesDeps {
  readonly logEntryRepository: LogEntryRepository;
  readonly metricSampleRepository: MetricSampleRepository;
  readonly traceRepository: TraceRepository;
  readonly alertRepository: AlertRepository;
  readonly snapshotRepository: ObservabilitySnapshotRepository;
  readonly healthCheckRepository: HealthCheckRepository;
  readonly performanceSampleRepository: PerformanceSampleRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}

/** Creates a real {@link ObservabilityQueries} read port over the given repositories. */
export function createObservabilityQueries(deps: ObservabilityQueriesDeps): ObservabilityQueries {
  return {
    async findLogs(query: FindLogsQuery): Promise<FindLogsResult> {
      let logs = query.category
        ? await deps.logEntryRepository.findByCategory(query.organizationId, query.category)
        : await deps.logEntryRepository.findAll(query.organizationId);
      if (query.level) logs = logs.filter((entry) => entry.level === query.level);
      return { logs: paginate(logs, query.offset, query.limit), total: logs.length };
    },

    async findMetrics(query: FindMetricsQuery): Promise<FindMetricsResult> {
      let metrics = query.metricName
        ? await deps.metricSampleRepository.findByName(query.organizationId, query.metricName)
        : await deps.metricSampleRepository.findAll(query.organizationId);
      if (query.metricType) metrics = metrics.filter((sample) => sample.metricType === query.metricType);
      return { metrics: paginate(metrics, query.offset, query.limit), total: metrics.length };
    },

    async findTraces(query: FindTracesQuery): Promise<FindTracesResult> {
      const traces = query.status
        ? await deps.traceRepository.findByStatus(query.organizationId, query.status)
        : await deps.traceRepository.findAll(query.organizationId);
      return { traces: paginate(traces, query.offset, query.limit), total: traces.length };
    },

    async findAlerts(query: FindAlertsQuery): Promise<FindAlertsResult> {
      let alerts = query.status
        ? await deps.alertRepository.findByStatus(query.organizationId, query.status)
        : await deps.alertRepository.findAll(query.organizationId);
      if (query.alertType) alerts = alerts.filter((alert) => alert.alertType === query.alertType);
      return { alerts: paginate(alerts, query.offset, query.limit), total: alerts.length };
    },

    async findSnapshots(query: FindSnapshotsQuery): Promise<FindSnapshotsResult> {
      const snapshots = query.category
        ? await deps.snapshotRepository.findByCategory(query.organizationId, query.category)
        : await deps.snapshotRepository.findAll(query.organizationId);
      return { snapshots: paginate(snapshots, query.offset, query.limit), total: snapshots.length };
    },

    async findHealth(query: FindHealthQuery): Promise<FindHealthResult> {
      const checks = query.component
        ? await deps.healthCheckRepository.findByComponent(query.organizationId, query.component)
        : await deps.healthCheckRepository.findAll(query.organizationId);
      return { checks: paginate(checks, query.offset, query.limit), total: checks.length };
    },

    async findPerformance(query: FindPerformanceQuery): Promise<FindPerformanceResult> {
      const samples = query.metric
        ? await deps.performanceSampleRepository.findByMetric(query.organizationId, query.metric)
        : await deps.performanceSampleRepository.findAll(query.organizationId);
      return { samples: paginate(samples, query.offset, query.limit), total: samples.length };
    },

    async searchObservability(query: SearchObservabilityQuery): Promise<SearchObservabilityResult> {
      const [logs, traces, alerts, healthChecks] = await Promise.all([
        deps.logEntryRepository.findAll(query.organizationId),
        deps.traceRepository.findAll(query.organizationId),
        deps.alertRepository.findAll(query.organizationId),
        deps.healthCheckRepository.findAll(query.organizationId),
      ]);

      const matches: SearchObservabilityMatch[] = [];
      for (const log of logs) {
        const score = scoreLabel(log.message, query.keyword);
        if (score > 0) matches.push({ recordType: 'log', id: log.id, label: log.message, score });
      }
      for (const trace of traces) {
        const score = scoreLabel(trace.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'trace', id: trace.id, label: trace.name, score });
      }
      for (const alert of alerts) {
        const score = scoreLabel(alert.message, query.keyword);
        if (score > 0) matches.push({ recordType: 'alert', id: alert.id, label: alert.message, score });
      }
      for (const check of healthChecks) {
        const score = scoreLabel(check.component, query.keyword);
        if (score > 0) matches.push({ recordType: 'health', id: check.id, label: check.component, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      const limited = query.limit === undefined ? matches : matches.slice(0, query.limit);
      return { matches: limited, total: matches.length };
    },
  };
}
