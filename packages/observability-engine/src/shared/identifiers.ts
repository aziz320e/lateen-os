/**
 * Identifier types for the Observability Platform bounded context.
 *
 * Where a sibling package already owns a canonical id, it is reused
 * directly rather than redefined.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { OrganizationId } from '@lateen-os/workflow-engine';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Structured log entry identifier. */
export type LogEntryId = Identifier;

/** Metric sample identifier. */
export type MetricSampleId = Identifier;

/** Distributed trace identifier. */
export type TraceId = Identifier;

/** Trace span identifier. */
export type SpanId = Identifier;

/** Health check identifier. */
export type HealthCheckId = Identifier;

/** Alert identifier. */
export type AlertId = Identifier;

/** Performance sample identifier. */
export type PerformanceSampleId = Identifier;

/** Audit timeline entry identifier. */
export type AuditTimelineEntryId = Identifier;

/** Observability snapshot identifier. */
export type ObservabilitySnapshotId = Identifier;
