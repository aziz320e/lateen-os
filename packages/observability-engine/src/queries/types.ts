/** @module queries/types */
import type { Alert, AlertStatus, AlertType } from '../alerting/types.js';
import type { HealthCheck } from '../health/types.js';
import type { LogEntry, LogLevel } from '../logging/types.js';
import type { MetricSample, MetricType } from '../metrics/types.js';
import type { PerformanceMetric, PerformanceSample } from '../performance/types.js';
import type { ObservabilitySnapshot, ObservabilitySnapshotCategory } from '../snapshot/types.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { Trace, TraceStatus } from '../tracing/types.js';

export interface FindLogsQuery extends OrganizationScopedQuery {
  readonly level?: LogLevel;
  readonly category?: string;
}
export interface FindLogsResult {
  readonly logs: readonly LogEntry[];
  readonly total: number;
}

export interface FindMetricsQuery extends OrganizationScopedQuery {
  readonly metricName?: string;
  readonly metricType?: MetricType;
}
export interface FindMetricsResult {
  readonly metrics: readonly MetricSample[];
  readonly total: number;
}

export interface FindTracesQuery extends OrganizationScopedQuery {
  readonly status?: TraceStatus;
}
export interface FindTracesResult {
  readonly traces: readonly Trace[];
  readonly total: number;
}

export interface FindAlertsQuery extends OrganizationScopedQuery {
  readonly status?: AlertStatus;
  readonly alertType?: AlertType;
}
export interface FindAlertsResult {
  readonly alerts: readonly Alert[];
  readonly total: number;
}

export interface FindSnapshotsQuery extends OrganizationScopedQuery {
  readonly category?: ObservabilitySnapshotCategory;
}
export interface FindSnapshotsResult {
  readonly snapshots: readonly ObservabilitySnapshot[];
  readonly total: number;
}

export interface FindHealthQuery extends OrganizationScopedQuery {
  readonly component?: string;
}
export interface FindHealthResult {
  readonly checks: readonly HealthCheck[];
  readonly total: number;
}

export interface FindPerformanceQuery extends OrganizationScopedQuery {
  readonly metric?: PerformanceMetric;
}
export interface FindPerformanceResult {
  readonly samples: readonly PerformanceSample[];
  readonly total: number;
}

export interface SearchObservabilityQuery extends OrganizationScopedQuery {
  readonly keyword: string;
}

export interface SearchObservabilityMatch {
  readonly recordType: 'log' | 'trace' | 'alert' | 'health';
  readonly id: string;
  readonly label: string;
  readonly score: number;
}

export interface SearchObservabilityResult {
  readonly matches: readonly SearchObservabilityMatch[];
  readonly total: number;
}
