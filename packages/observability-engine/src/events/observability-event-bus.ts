/**
 * Real, typed event bus for the Observability Platform runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/observability-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type ObservabilityEventMap = {
  'log.created': { readonly organizationId: string; readonly logEntryId: string; readonly level: string; readonly category: string };
  'metric.updated': { readonly organizationId: string; readonly metricSampleId: string; readonly metricName: string; readonly metricType: string };
  'trace.completed': { readonly organizationId: string; readonly traceId: string; readonly durationMs: number; readonly status: string };
  'alert.created': { readonly organizationId: string; readonly alertId: string; readonly alertType: string; readonly severity: string };
  'alert.resolved': { readonly organizationId: string; readonly alertId: string };
  'health.changed': { readonly organizationId: string; readonly healthCheckId: string; readonly component: string; readonly status: string };
  'snapshot.created': { readonly organizationId: string; readonly snapshotId: string; readonly category: string };
};

export type ObservabilityEventBus = EventBus<ObservabilityEventMap>;

/** Creates an in-memory {@link ObservabilityEventBus}. */
export function createObservabilityEventBus(): ObservabilityEventBus {
  return createEventBus<ObservabilityEventMap>();
}
