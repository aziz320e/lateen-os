/**
 * Entity foundation for the real Domain Graph aggregate (the `DomainGraph`
 * container itself — distinct from the lighter-weight `GraphNode`/`GraphEdge`
 * ontology structures, which stay tenant-scoped only).
 *
 * @module shared/entity
 */

import type { Entity } from '@lateen-os/shared-kernel/core';
import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { GraphTenantScoped } from './primitives.js';

export type { Entity };

export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

/** Tenant-scoped aggregate with audit timestamps. */
export interface TenantAuditableEntity<TId extends Identifier = Identifier>
  extends Entity<TId>,
    GraphTenantScoped,
    Auditable {}
