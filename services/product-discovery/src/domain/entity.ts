/** @module domain/entity */
import type { Entity } from '@lateen-os/shared-kernel/core';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { OrganizationId } from './identifiers.js';
import type { Auditable } from './primitives.js';

export type { Entity };

export interface TenantScoped {
  readonly organizationId: OrganizationId;
}

export interface TenantAuditableEntity<TId extends Identifier = Identifier>
  extends Entity<TId>,
    TenantScoped,
    Auditable {}
