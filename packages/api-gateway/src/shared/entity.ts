/**
 * Entity foundation for API Gateway aggregates.
 *
 * @module shared/entity
 */

import type { Entity } from '@lateen-os/shared-kernel/core';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { Auditable, TenantScoped } from './primitives.js';

export type { Entity };

/** Tenant-scoped aggregate with audit timestamps. */
export interface TenantAuditableEntity<TId extends Identifier = Identifier>
  extends Entity<TId>,
    TenantScoped,
    Auditable {}
