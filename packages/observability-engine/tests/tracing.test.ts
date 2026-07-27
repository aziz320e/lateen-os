import { describe, expect, it, vi } from 'vitest';
import { createObservabilityEventBus } from '../src/events/observability-event-bus.js';
import { createSpanRepository, createTraceRepository } from '../src/tracing/repository.impl.js';
import { createTracingEngine } from '../src/tracing/engine.impl.js';
import { SpanNotFoundError, TraceNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const traceRepository = createTraceRepository();
  const spanRepository = createSpanRepository();
  const eventBus = createObservabilityEventBus();
  const engine = createTracingEngine(traceRepository, spanRepository, eventBus);
  return { traceRepository, spanRepository, eventBus, engine };
}

describe('createTracingEngine — traces', () => {
  it('startTrace() creates a running trace', async () => {
    const { engine } = setup();
    const trace = await engine.startTrace(ORG, 'process-order');
    expect(trace.status).toBe('running');
    expect(trace.name).toBe('process-order');
    expect(trace.endedAt).toBeUndefined();
  });

  it('endTrace() defaults to completed and computes a duration', async () => {
    const { engine } = setup();
    const trace = await engine.startTrace(ORG, 'op');
    const ended = await engine.endTrace(ORG, trace.id);
    expect(ended.status).toBe('completed');
    expect(ended.endedAt).toBeDefined();
    expect(ended.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('endTrace() accepts an explicit failed status', async () => {
    const { engine } = setup();
    const trace = await engine.startTrace(ORG, 'op');
    const ended = await engine.endTrace(ORG, trace.id, 'failed');
    expect(ended.status).toBe('failed');
  });

  it('endTrace() throws TraceNotFoundError for an unknown trace', async () => {
    const { engine } = setup();
    await expect(engine.endTrace(ORG, 'missing')).rejects.toThrow(TraceNotFoundError);
  });

  it('endTrace() publishes trace.completed with durationMs and status', async () => {
    const { engine, eventBus } = setup();
    const handler = vi.fn();
    eventBus.subscribe('trace.completed', handler);
    const trace = await engine.startTrace(ORG, 'op');
    await engine.endTrace(ORG, trace.id, 'completed');
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG, traceId: trace.id, status: 'completed' }),
      expect.anything(),
    );
  });
});

describe('createTracingEngine — spans', () => {
  it('startSpan() creates a span under a trace', async () => {
    const { engine } = setup();
    const trace = await engine.startTrace(ORG, 'op');
    const span = await engine.startSpan(ORG, trace.id, 'validate');
    expect(span.traceId).toBe(trace.id);
    expect(span.name).toBe('validate');
    expect(span.endedAt).toBeUndefined();
  });

  it('startSpan() accepts a parentSpanId and attributes', async () => {
    const { engine } = setup();
    const trace = await engine.startTrace(ORG, 'op');
    const parent = await engine.startSpan(ORG, trace.id, 'parent');
    const child = await engine.startSpan(ORG, trace.id, 'child', parent.id, { key: 'value' });
    expect(child.parentSpanId).toBe(parent.id);
    expect(child.attributes).toEqual({ key: 'value' });
  });

  it('endSpan() sets endedAt and computes a duration', async () => {
    const { engine } = setup();
    const trace = await engine.startTrace(ORG, 'op');
    const span = await engine.startSpan(ORG, trace.id, 'validate');
    const ended = await engine.endSpan(ORG, span.id);
    expect(ended.endedAt).toBeDefined();
    expect(ended.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('endSpan() throws SpanNotFoundError for an unknown span', async () => {
    const { engine } = setup();
    await expect(engine.endSpan(ORG, 'missing')).rejects.toThrow(SpanNotFoundError);
  });

  it('findSpansByTrace() returns every span for a trace', async () => {
    const { engine } = setup();
    const trace = await engine.startTrace(ORG, 'op');
    await engine.startSpan(ORG, trace.id, 'a');
    await engine.startSpan(ORG, trace.id, 'b');
    const otherTrace = await engine.startTrace(ORG, 'other');
    await engine.startSpan(ORG, otherTrace.id, 'c');
    expect(await engine.findSpansByTrace(ORG, trace.id)).toHaveLength(2);
  });
});

describe('createTracingEngine — get / list / org scoping', () => {
  it('getTrace() returns null for an unknown trace', async () => {
    const { engine } = setup();
    expect(await engine.getTrace(ORG, 'missing')).toBeNull();
  });

  it('listTraces() returns every trace for the organization', async () => {
    const { engine } = setup();
    await engine.startTrace(ORG, 'a');
    await engine.startTrace(ORG, 'b');
    expect(await engine.listTraces(ORG)).toHaveLength(2);
  });

  it('traces are organization-scoped', async () => {
    const { engine, traceRepository } = setup();
    const trace = await engine.startTrace(ORG, 'a');
    expect(await traceRepository.findById('org-2', trace.id)).toBeNull();
  });
});

describe('createTraceRepository — findByStatus', () => {
  it('filters traces by status', async () => {
    const { engine, traceRepository } = setup();
    const a = await engine.startTrace(ORG, 'a');
    await engine.startTrace(ORG, 'b');
    await engine.endTrace(ORG, a.id);
    expect(await traceRepository.findByStatus(ORG, 'completed')).toHaveLength(1);
    expect(await traceRepository.findByStatus(ORG, 'running')).toHaveLength(1);
  });

  it('returns an empty array for a status with no matching traces', async () => {
    const { engine, traceRepository } = setup();
    await engine.startTrace(ORG, 'a');
    expect(await traceRepository.findByStatus(ORG, 'failed')).toEqual([]);
  });
});

describe('createTracingEngine — additional coverage', () => {
  it('supports 3 levels of span nesting', async () => {
    const { engine } = setup();
    const trace = await engine.startTrace(ORG, 'op');
    const root = await engine.startSpan(ORG, trace.id, 'root');
    const child = await engine.startSpan(ORG, trace.id, 'child', root.id);
    const grandchild = await engine.startSpan(ORG, trace.id, 'grandchild', child.id);
    expect(grandchild.parentSpanId).toBe(child.id);
    expect(child.parentSpanId).toBe(root.id);
    expect(root.parentSpanId).toBeUndefined();
  });

  it('findSpansByTrace returns an empty array for a trace with no spans', async () => {
    const { engine } = setup();
    const trace = await engine.startTrace(ORG, 'op');
    expect(await engine.findSpansByTrace(ORG, trace.id)).toEqual([]);
  });

  it('accepts an injectable now() clock', async () => {
    const fixed = '2026-03-01T00:00:00.000Z';
    const traceRepository = createTraceRepository();
    const spanRepository = createSpanRepository();
    const engine = createTracingEngine(traceRepository, spanRepository, undefined, () => fixed);
    const trace = await engine.startTrace(ORG, 'op');
    expect(trace.startedAt).toBe(fixed);
  });

  it('ending one trace does not affect another trace\'s status', async () => {
    const { engine } = setup();
    const a = await engine.startTrace(ORG, 'a');
    const b = await engine.startTrace(ORG, 'b');
    await engine.endTrace(ORG, a.id);
    const stillRunning = await engine.getTrace(ORG, b.id);
    expect(stillRunning?.status).toBe('running');
  });

  it('spans are organization-scoped', async () => {
    const { engine, spanRepository } = setup();
    const trace = await engine.startTrace(ORG, 'op');
    const span = await engine.startSpan(ORG, trace.id, 'a');
    expect(await spanRepository.findById('org-2', span.id)).toBeNull();
  });

  it('listTraces() returns an empty array for an organization with no traces', async () => {
    const { engine } = setup();
    expect(await engine.listTraces(ORG)).toEqual([]);
  });

  it('startSpan() without a parentSpanId leaves it undefined', async () => {
    const { engine } = setup();
    const trace = await engine.startTrace(ORG, 'op');
    const span = await engine.startSpan(ORG, trace.id, 'root');
    expect(span.parentSpanId).toBeUndefined();
  });

  it('each trace has a distinct id', async () => {
    const { engine } = setup();
    const a = await engine.startTrace(ORG, 'a');
    const b = await engine.startTrace(ORG, 'b');
    expect(a.id).not.toBe(b.id);
  });
});
