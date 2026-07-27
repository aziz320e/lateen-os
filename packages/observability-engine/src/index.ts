/**
 * @lateen-os/observability-engine — Observability Platform
 *
 * Structured logging, metrics, distributed tracing, health, alerting,
 * performance, audit timeline, and snapshots for Lateen OS. Real,
 * deterministic, offline implementation — see `runtime.ts`'s
 * `createObservabilityRuntime()` for the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as logging from './logging/index.js';
export * as metrics from './metrics/index.js';
export * as tracing from './tracing/index.js';
export * as health from './health/index.js';
export * as alerting from './alerting/index.js';
export * as performance from './performance/index.js';
export * as auditTimeline from './audit-timeline/index.js';
export * as snapshot from './snapshot/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createObservabilityRuntime,
  type ObservabilityRuntime,
  type ObservabilityRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { LogEntry, LogLevel, LogEntryId } from './logging/types.js';
export type { MetricSample, MetricType, MetricSampleId } from './metrics/types.js';
export type { Trace, TraceStatus, Span, TraceId, SpanId } from './tracing/types.js';
export type { HealthCheck, HealthStatus, HealthCheckId } from './health/types.js';
export type { Alert, AlertType, AlertSeverity, AlertStatus, AlertId } from './alerting/types.js';
export type { PerformanceSample, PerformanceMetric, PerformanceUnit, PerformanceSampleId } from './performance/types.js';
export type { AuditTimelineEntry, AuditTimelineSource, AuditTimelineEntryId } from './audit-timeline/types.js';
export type { ObservabilitySnapshot, ObservabilitySnapshotCategory, ObservabilitySnapshotId } from './snapshot/types.js';

/** Real lifecycle/service ports. */
export { type LoggingEngine, type LogInput } from './logging/engine.impl.js';
export {
  type MetricsEngine,
  computeMovingAverage,
  computeHistogramStats,
  type HistogramStats,
} from './metrics/engine.impl.js';
export { type TracingEngine } from './tracing/engine.impl.js';
export { type HealthEngine, type HealthEngineDeps } from './health/engine.impl.js';
export { type AlertEngine, type AlertEngineDeps } from './alerting/engine.impl.js';
export { type PerformanceEngine, type PerformanceEngineDeps, type ExecutionTimeScope } from './performance/engine.impl.js';
export { type AuditTimelineEngine, type AuditTimelineDeps } from './audit-timeline/engine.impl.js';
export { type SnapshotEngine, type SnapshotEngineDeps } from './snapshot/engine.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { LogEntryRepository } from './logging/repository.js';
export type { MetricSampleRepository } from './metrics/repository.js';
export type { TraceRepository, SpanRepository } from './tracing/repository.js';
export type { HealthCheckRepository } from './health/repository.js';
export type { AlertRepository } from './alerting/repository.js';
export type { PerformanceSampleRepository } from './performance/repository.js';
export type { AuditTimelineRepository } from './audit-timeline/repository.js';
export type { ObservabilitySnapshotRepository } from './snapshot/repository.js';

/** Relationship Layer (AI Runtime / Workflow Engine / Communication Hub / AI Security / AI Governance / AI Compliance / Analytics Engine integration). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { ObservabilityQueries } from './queries/observability-queries.js';

/** Typed event bus. */
export type { ObservabilityDomainEvent } from './events/observability-events.js';
export { OBSERVABILITY_EVENT_NAMES } from './events/observability-events.js';
