/** @module marketplace-catalog/repository */
import type { Repository } from '../shared/repository.js';
import type { CatalogEntryId, OrganizationId } from '../shared/identifiers.js';
import type { CatalogEntry } from './types.js';

export interface CatalogEntryRepository extends Repository<CatalogEntry, CatalogEntryId> {
  findAll(organizationId: OrganizationId): Promise<readonly CatalogEntry[]>;
  findByCategory(organizationId: OrganizationId, category: string): Promise<readonly CatalogEntry[]>;
  findByPublisher(organizationId: OrganizationId, publisher: string): Promise<readonly CatalogEntry[]>;
}
