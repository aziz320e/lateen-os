/**
 * Entity foundation for Marketplace aggregates.
 *
 * @module shared/entity
 */

import type { Entity } from '@lateen-os/shared-kernel/core';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { Auditable } from './primitives.js';
import type { OrganizationId } from './identifiers.js';

export type { Entity };

/** Tenant scope — every Marketplace aggregate belongs to one organization. */
export interface TenantScoped {
  readonly organizationId: OrganizationId;
}

/** Tenant-scoped aggregate with audit timestamps. */
export interface TenantAuditableEntity<TId extends Identifier = Identifier>
  extends Entity<TId>,
    TenantScoped,
    Auditable {}
