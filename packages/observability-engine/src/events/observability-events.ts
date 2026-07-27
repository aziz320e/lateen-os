/** @module events/observability-events */
import type { DomainEvent } from '@lateen-os/shared-kernel/core';

export type LogCreatedEvent = DomainEvent<
  'log.created',
  { readonly organizationId: string; readonly logEntryId: string; readonly level: string; readonly category: string }
>;

export type MetricUpdatedEvent = DomainEvent<
  'metric.updated',
  { readonly organizationId: string; readonly metricSampleId: string; readonly metricName: string; readonly metricType: string }
>;

export type TraceCompletedEvent = DomainEvent<
  'trace.completed',
  { readonly organizationId: string; readonly traceId: string; readonly durationMs: number; readonly status: string }
>;

export type AlertCreatedEvent = DomainEvent<
  'alert.created',
  { readonly organizationId: string; readonly alertId: string; readonly alertType: string; readonly severity: string }
>;

export type AlertResolvedEvent = DomainEvent<
  'alert.resolved',
  { readonly organizationId: string; readonly alertId: string }
>;

export type HealthChangedEvent = DomainEvent<
  'health.changed',
  { readonly organizationId: string; readonly healthCheckId: string; readonly component: string; readonly status: string }
>;

export type SnapshotCreatedEvent = DomainEvent<
  'snapshot.created',
  { readonly organizationId: string; readonly snapshotId: string; readonly category: string }
>;

/** Canonical event names for external subscribers. */
export const OBSERVABILITY_EVENT_NAMES = {
  LogCreated: 'log.created',
  MetricUpdated: 'metric.updated',
  TraceCompleted: 'trace.completed',
  AlertCreated: 'alert.created',
  AlertResolved: 'alert.resolved',
  HealthChanged: 'health.changed',
  SnapshotCreated: 'snapshot.created',
} as const;

/** Union of all Observability Platform domain events. */
export type ObservabilityDomainEvent =
  | LogCreatedEvent
  | MetricUpdatedEvent
  | TraceCompletedEvent
  | AlertCreatedEvent
  | AlertResolvedEvent
  | HealthChangedEvent
  | SnapshotCreatedEvent;
