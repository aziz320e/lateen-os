/** @module telemetry/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  OrganizationId,
  RuntimeSessionId,
  SpanId,
  TelemetryEventId,
  TraceId,
} from '../shared/identifiers.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { TelemetryEventId, TraceId, SpanId };

export type TelemetryEventType =
  | 'session_started'
  | 'session_ended'
  | 'task_started'
  | 'task_completed'
  | 'tool_called'
  | 'error';

/** Domain telemetry event emitted by the runtime. */
export interface TelemetryEvent extends TenantAuditableEntity<TelemetryEventId> {
  readonly type: TelemetryEventType;
  readonly sessionId?: RuntimeSessionId;
  readonly traceId?: TraceId;
  readonly payload?: Readonly<Record<string, unknown>>;
  readonly occurredAt: Timestamp;
}

/** Distributed trace for a runtime operation. */
export interface Trace extends TenantAuditableEntity<TraceId> {
  readonly name: string;
  readonly startedAt: Timestamp;
  readonly endedAt?: Timestamp;
}

/** Span within a trace. */
export interface Span {
  readonly spanId: SpanId;
  readonly traceId: TraceId;
  readonly name: string;
  readonly startedAt: Timestamp;
  readonly endedAt?: Timestamp;
  readonly attributes?: Readonly<Record<string, unknown>>;
}

export type { OrganizationId };
