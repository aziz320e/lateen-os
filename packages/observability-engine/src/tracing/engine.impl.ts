/**
 * Real Distributed Tracing engine — traces, spans, parent/child span
 * nesting, duration, and status.
 *
 * @module tracing/engine.impl
 */
import type { ObservabilityEventBus } from '../events/observability-event-bus.js';
import { SpanNotFoundError, TraceNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, SpanId, TraceId } from '../shared/identifiers.js';
import type { SpanRepository, TraceRepository } from './repository.js';
import type { Span, Trace, TraceStatus } from './types.js';

function durationBetween(startedAt: string, endedAt: string): number {
  return new Date(endedAt).getTime() - new Date(startedAt).getTime();
}

export interface TracingEngine {
  startTrace(organizationId: OrganizationId, name: string): Promise<Trace>;
  endTrace(organizationId: OrganizationId, traceId: TraceId, status?: Exclude<TraceStatus, 'running'>): Promise<Trace>;
  startSpan(organizationId: OrganizationId, traceId: TraceId, name: string, parentSpanId?: SpanId, attributes?: Readonly<Record<string, unknown>>): Promise<Span>;
  endSpan(organizationId: OrganizationId, spanId: SpanId): Promise<Span>;
  getTrace(organizationId: OrganizationId, traceId: TraceId): Promise<Trace | null>;
  listTraces(organizationId: OrganizationId): Promise<readonly Trace[]>;
  findSpansByTrace(organizationId: OrganizationId, traceId: TraceId): Promise<readonly Span[]>;
}

/** Creates a real {@link TracingEngine} over the given repositories. */
export function createTracingEngine(
  traceRepository: TraceRepository,
  spanRepository: SpanRepository,
  eventBus?: ObservabilityEventBus,
  now: () => string = nowIso,
): TracingEngine {
  return {
    async startTrace(organizationId, name) {
      const timestamp = now();
      const trace: Trace = {
        id: generateId('trace'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name,
        status: 'running',
        startedAt: timestamp,
      };
      await traceRepository.save(trace);
      return trace;
    },

    async endTrace(organizationId, traceId, status = 'completed') {
      const trace = await traceRepository.findById(organizationId, traceId);
      if (!trace) throw new TraceNotFoundError(traceId);
      const timestamp = now();
      const ended: Trace = {
        ...trace,
        updatedAt: timestamp,
        status,
        endedAt: timestamp,
        durationMs: durationBetween(trace.startedAt, timestamp),
      };
      await traceRepository.save(ended);
      eventBus?.publish('trace.completed', { organizationId, traceId, durationMs: ended.durationMs ?? 0, status });
      return ended;
    },

    async startSpan(organizationId, traceId, name, parentSpanId, attributes) {
      const timestamp = now();
      const span: Span = {
        id: generateId('span'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        traceId,
        parentSpanId,
        name,
        startedAt: timestamp,
        attributes,
      };
      await spanRepository.save(span);
      return span;
    },

    async endSpan(organizationId, spanId) {
      const span = await spanRepository.findById(organizationId, spanId);
      if (!span) throw new SpanNotFoundError(spanId);
      const timestamp = now();
      const ended: Span = {
        ...span,
        updatedAt: timestamp,
        endedAt: timestamp,
        durationMs: durationBetween(span.startedAt, timestamp),
      };
      await spanRepository.save(ended);
      return ended;
    },

    async getTrace(organizationId, traceId) {
      return traceRepository.findById(organizationId, traceId);
    },

    async listTraces(organizationId) {
      return traceRepository.findAll(organizationId);
    },

    async findSpansByTrace(organizationId, traceId) {
      return spanRepository.findByTrace(organizationId, traceId);
    },
  };
}
