/** Real, in-memory {@link TraceRepository} / {@link SpanRepository} implementations. @module tracing/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { SpanRepository, TraceRepository } from './repository.js';
import type { Span, Trace } from './types.js';

/** Creates a real, in-memory {@link TraceRepository}. */
export function createTraceRepository(seed?: readonly Trace[]): TraceRepository {
  const repo = createInMemoryRepository<Trace>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((trace) => trace.status === status);
    },
  };
}

/** Creates a real, in-memory {@link SpanRepository}. */
export function createSpanRepository(seed?: readonly Span[]): SpanRepository {
  const repo = createInMemoryRepository<Span>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByTrace(organizationId, traceId) {
      return repo.list(organizationId).filter((span) => span.traceId === traceId);
    },
  };
}
