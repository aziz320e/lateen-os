/** @module audit/types */
import type { AuditEventId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { AuditEventId };

/** Deterministic audit category — one per security subsystem. */
export type AuditCategory = 'authentication' | 'authorization' | 'secret' | 'prompt' | 'tool' | 'provider' | 'policy' | 'threat' | 'data';

export type AuditOutcome = 'success' | 'failure' | 'blocked';

/** A single, immutable security audit event — the sole audit sink for every subsystem in this package. */
export interface AuditEvent {
  readonly id: AuditEventId;
  readonly organizationId: string;
  readonly category: AuditCategory;
  readonly action: string;
  /** The identity (or other actor reference) responsible for this event, if known. */
  readonly actorId?: string;
  readonly outcome: AuditOutcome;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly occurredAt: ISODateTime;
}
