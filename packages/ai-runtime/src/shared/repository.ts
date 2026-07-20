/** @module shared/repository */
import type { Entity } from '@lateen-os/shared-kernel/core';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { OrganizationId } from './identifiers.js';

export interface ReadRepository<TEntity extends Entity, TId extends Identifier> {
  findById(organizationId: OrganizationId, id: TId): Promise<TEntity | null>;
}

export interface WriteRepository<TEntity extends Entity, TId extends Identifier> {
  save(entity: TEntity): Promise<void>;
  delete(organizationId: OrganizationId, id: TId): Promise<void>;
}

export interface Repository<TEntity extends Entity, TId extends Identifier>
  extends ReadRepository<TEntity, TId>,
    WriteRepository<TEntity, TId> {}

export interface OrganizationScopedQuery {
  readonly organizationId: OrganizationId;
  readonly offset?: number;
  readonly limit?: number;
}
