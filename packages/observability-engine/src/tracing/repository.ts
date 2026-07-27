/** @module tracing/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, SpanId, TraceId } from '../shared/identifiers.js';
import type { Span, Trace, TraceStatus } from './types.js';

export interface TraceRepository extends Repository<Trace, TraceId> {
  findAll(organizationId: OrganizationId): Promise<readonly Trace[]>;
  findByStatus(organizationId: OrganizationId, status: TraceStatus): Promise<readonly Trace[]>;
}

export interface SpanRepository extends Repository<Span, SpanId> {
  findAll(organizationId: OrganizationId): Promise<readonly Span[]>;
  findByTrace(organizationId: OrganizationId, traceId: TraceId): Promise<readonly Span[]>;
}
