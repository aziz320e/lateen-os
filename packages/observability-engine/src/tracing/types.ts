/** @module tracing/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { SpanId, TraceId } from '../shared/identifiers.js';

export type { SpanId, TraceId };

export type TraceStatus = 'running' | 'completed' | 'failed';

/** A distributed trace for one logical runtime operation. */
export interface Trace extends TenantAuditableEntity<TraceId> {
  readonly name: string;
  readonly status: TraceStatus;
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly durationMs?: number;
}

/** A span within a trace — optionally nested under a parent span. */
export interface Span extends TenantAuditableEntity<SpanId> {
  readonly traceId: TraceId;
  readonly parentSpanId?: SpanId;
  readonly name: string;
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly durationMs?: number;
  readonly attributes?: Readonly<Record<string, unknown>>;
}
