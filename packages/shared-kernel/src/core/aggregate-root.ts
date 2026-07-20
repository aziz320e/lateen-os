/**
 * Aggregate root marker — consistency boundary for domain transactions.
 *
 * @module core/aggregate-root
 */

import type { AuditInfo } from '../audit/audit-info.js';
import type { VersionInfo } from '../audit/version-info.js';
import type { Identifier } from '../identity/identifier.js';
import type { Entity } from './entity.js';

/** Aggregate root with optional audit trail and optimistic concurrency version. */
export interface AggregateRoot<TId extends Identifier = Identifier>
  extends Entity<TId>,
    Partial<AuditInfo>,
    Partial<VersionInfo> {}
