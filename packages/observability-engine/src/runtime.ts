/**
 * Observability Runtime — the package's composition root. Wires every
 * real in-memory repository and service together: Structured Logging,
 * the Metrics Collector, Distributed Tracing, the Health Engine, the
 * Alert Engine, the Performance Engine, the Audit Timeline, the
 * Snapshot Engine (each composed with the real, optional sibling
 * package query ports it needs), the Relationship Layer (one
 * additional real signal per integrated package), the query layer, and
 * the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link ObservabilityRuntime} surface.
 *
 * @module runtime
 */
import type { RuntimeQueries } from '@lateen-os/ai-runtime';
import type { ComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import type { GovernanceRuntime } from '@lateen-os/ai-governance-engine';
import type { SecurityRuntime } from '@lateen-os/ai-security-engine';
import type { AnalyticsQueries } from '@lateen-os/analytics-engine';
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';
import { createAlertEngine, createAlertRepository, type AlertEngine } from './alerting/index.js';
import { createAuditTimelineEngine, createAuditTimelineRepository, type AuditTimelineEngine } from './audit-timeline/index.js';
import { createObservabilityEventBus, type ObservabilityEventBus } from './events/index.js';
import { createHealthEngine, createHealthCheckRepository, type HealthEngine } from './health/index.js';
import { createLoggingEngine, createLogEntryRepository, type LoggingEngine } from './logging/index.js';
import { createMetricsEngine, createMetricSampleRepository, type MetricsEngine } from './metrics/index.js';
import { createPerformanceEngine, createPerformanceSampleRepository, type PerformanceEngine } from './performance/index.js';
import { createObservabilityQueries, type ObservabilityQueries } from './queries/index.js';
import { createRelationshipManagement, type RelationshipManagement } from './relationship-management/index.js';
import { nowIso } from './shared/id.js';
import { createObservabilitySnapshotRepository, createSnapshotEngine, type SnapshotEngine } from './snapshot/index.js';
import { createSpanRepository, createTraceRepository, createTracingEngine, type TracingEngine } from './tracing/index.js';

export interface ObservabilityRuntimeDeps {
  readonly eventBus?: ObservabilityEventBus;
  readonly now?: () => string;
  readonly aiRuntime?: Pick<RuntimeQueries, 'findRuntimeState' | 'findExecutionHistory' | 'findTasks' | 'findAgent'>;
  readonly workflow?: Pick<WorkflowRuntime, 'queries'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'queries'>;
  readonly aiSecurity?: Pick<SecurityRuntime, 'queries'>;
  readonly aiGovernance?: Pick<GovernanceRuntime, 'queries'>;
  readonly aiCompliance?: Pick<ComplianceRuntime, 'queries'>;
  readonly analyticsEngine?: Pick<AnalyticsQueries, 'findKPIs' | 'findDashboards'>;
}

export interface ObservabilityRuntime {
  readonly logging: LoggingEngine;
  readonly metrics: MetricsEngine;
  readonly tracing: TracingEngine;
  readonly health: HealthEngine;
  readonly alerts: AlertEngine;
  readonly performance: PerformanceEngine;
  readonly auditTimeline: AuditTimelineEngine;
  readonly snapshots: SnapshotEngine;
  readonly relationships: RelationshipManagement;
  readonly queries: ObservabilityQueries;
  /** Typed event bus — subscribe to log/metric/trace/alert/health/snapshot events. */
  readonly events: ObservabilityEventBus;
}

/** Creates a real, in-memory {@link ObservabilityRuntime}. */
export function createObservabilityRuntime(deps: ObservabilityRuntimeDeps = {}): ObservabilityRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createObservabilityEventBus();

  const logEntryRepository = createLogEntryRepository();
  const metricSampleRepository = createMetricSampleRepository();
  const traceRepository = createTraceRepository();
  const spanRepository = createSpanRepository();
  const healthCheckRepository = createHealthCheckRepository();
  const alertRepository = createAlertRepository();
  const performanceSampleRepository = createPerformanceSampleRepository();
  const auditTimelineRepository = createAuditTimelineRepository();
  const snapshotRepository = createObservabilitySnapshotRepository();

  const logging = createLoggingEngine(logEntryRepository, eventBus, now);
  const metrics = createMetricsEngine(metricSampleRepository, eventBus, now);
  const tracing = createTracingEngine(traceRepository, spanRepository, eventBus, now);
  const health = createHealthEngine(healthCheckRepository, { aiRuntime: deps.aiRuntime, workflow: deps.workflow }, eventBus, now);
  const alerts = createAlertEngine(alertRepository, { logging, health, workflow: deps.workflow, aiSecurity: deps.aiSecurity }, eventBus, now);
  const performance = createPerformanceEngine(performanceSampleRepository, { aiRuntime: deps.aiRuntime, workflow: deps.workflow, communicationHub: deps.communicationHub }, now);
  const auditTimeline = createAuditTimelineEngine(
    auditTimelineRepository,
    { aiSecurity: deps.aiSecurity, aiGovernance: deps.aiGovernance, aiCompliance: deps.aiCompliance, workflow: deps.workflow, communicationHub: deps.communicationHub },
    now,
  );
  const snapshots = createSnapshotEngine(
    snapshotRepository,
    { aiRuntime: deps.aiRuntime, workflow: deps.workflow, communicationHub: deps.communicationHub, analyticsEngine: deps.analyticsEngine, aiSecurity: deps.aiSecurity },
    eventBus,
    now,
  );

  const relationships = createRelationshipManagement({
    aiRuntime: deps.aiRuntime,
    workflow: deps.workflow,
    communicationHub: deps.communicationHub,
    aiSecurity: deps.aiSecurity,
    aiGovernance: deps.aiGovernance,
    aiCompliance: deps.aiCompliance,
    analyticsEngine: deps.analyticsEngine,
  });

  const queries = createObservabilityQueries({
    logEntryRepository,
    metricSampleRepository,
    traceRepository,
    alertRepository,
    snapshotRepository,
    healthCheckRepository,
    performanceSampleRepository,
  });

  return {
    logging,
    metrics,
    tracing,
    health,
    alerts,
    performance,
    auditTimeline,
    snapshots,
    relationships,
    queries,
    events: eventBus,
  };
}
