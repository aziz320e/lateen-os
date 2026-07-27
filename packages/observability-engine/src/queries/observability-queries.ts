/** @module queries/observability-queries */
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
  SearchObservabilityQuery,
  SearchObservabilityResult,
} from './types.js';

/** Real, read-only Observability Platform query port. */
export interface ObservabilityQueries {
  findLogs(query: FindLogsQuery): Promise<FindLogsResult>;
  findMetrics(query: FindMetricsQuery): Promise<FindMetricsResult>;
  findTraces(query: FindTracesQuery): Promise<FindTracesResult>;
  findAlerts(query: FindAlertsQuery): Promise<FindAlertsResult>;
  findSnapshots(query: FindSnapshotsQuery): Promise<FindSnapshotsResult>;
  findHealth(query: FindHealthQuery): Promise<FindHealthResult>;
  findPerformance(query: FindPerformanceQuery): Promise<FindPerformanceResult>;
  searchObservability(query: SearchObservabilityQuery): Promise<SearchObservabilityResult>;
}
