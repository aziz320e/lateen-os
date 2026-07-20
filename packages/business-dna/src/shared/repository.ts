/**
 * Repository port interfaces for Business DNA aggregates.
 * Implementations live outside this package (infrastructure layer).
 *
 * @module shared/repository
 */

import type { EntityId } from './identifiers.js';
import type { Entity } from './entity.js';
import type { OrganizationId } from './identifiers.js';

/** Read-side repository port. */
export interface ReadRepository<TEntity extends Entity, TId extends EntityId> {
  findById(organizationId: OrganizationId, id: TId): Promise<TEntity | null>;
}

/** Write-side repository port. */
export interface WriteRepository<TEntity extends Entity, TId extends EntityId> {
  save(entity: TEntity): Promise<void>;
  delete(organizationId: OrganizationId, id: TId): Promise<void>;
}

/** Combined read/write repository port for an aggregate. */
export interface Repository<TEntity extends Entity, TId extends EntityId>
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
