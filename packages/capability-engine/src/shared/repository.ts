/**
 * Repository port interfaces for Capability Engine aggregates.
 * Implementations live outside this package (infrastructure layer).
 *
 * @module shared/repository
 */

import type { Entity } from '@lateen-os/shared-kernel/core';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { OrganizationId } from './identifiers.js';

/** Read-side repository port. */
export interface ReadRepository<TEntity extends Entity, TId extends Identifier> {
  findById(organizationId: OrganizationId, id: TId): Promise<TEntity | null>;
}

/** Write-side repository port. */
export interface WriteRepository<TEntity extends Entity, TId extends Identifier> {
  save(entity: TEntity): Promise<void>;
  delete(organizationId: OrganizationId, id: TId): Promise<void>;
}

/** Combined read/write repository port. */
export interface Repository<TEntity extends Entity, TId extends Identifier>
  extends ReadRepository<TEntity, TId>,
    WriteRepository<TEntity, TId> {}

/** Paginated query result. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly offset: number;
  readonly limit: number;
}

/** Common list query options scoped to an organization. */
export interface OrganizationScopedQuery {
  readonly organizationId: OrganizationId;
  readonly offset?: number;
  readonly limit?: number;
}
