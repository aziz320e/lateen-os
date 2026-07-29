/** @module audit/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AuditEntryId } from '../shared/identifiers.js';

export type { AuditEntryId };

export interface AuditActor {
  readonly id: string;
  readonly type: string;
}

export interface AuditTarget {
  readonly type: string;
  readonly id: string;
}

/** One immutable, append-only audit timeline entry. */
export interface AuditEntry extends TenantAuditableEntity<AuditEntryId> {
  readonly actor: AuditActor;
  readonly action: string;
  readonly target: AuditTarget;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly recordedAt: string;
}
