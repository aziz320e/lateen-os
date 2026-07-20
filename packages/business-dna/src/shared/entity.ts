/**
 * Base entity marker interface for Business DNA aggregates.
 *
 * @module shared/entity
 */

import type { Entity } from '@lateen-os/shared-kernel/core';
import type { EntityId } from './identifiers.js';
import type { Auditable, TenantScoped } from './primitives.js';

export type { Entity };

/** Standard tenant-scoped aggregate with audit timestamps. */
export interface TenantAuditableEntity<TId extends EntityId = EntityId>
  extends Entity<TId>,
    TenantScoped,
    Auditable {}

/** Organization aggregate root — no tenant scope (is the tenant). */
export interface AuditableEntity<TId extends EntityId = EntityId> extends Entity<TId>, Auditable {}
