/** Real, in-memory Catalog Entry repository. @module marketplace-catalog/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { CatalogEntryRepository } from './repository.js';
import type { CatalogEntry } from './types.js';

/** Creates a real, in-memory {@link CatalogEntryRepository}. */
export function createCatalogEntryRepository(seed?: readonly CatalogEntry[]): CatalogEntryRepository {
  const repo = createInMemoryRepository<CatalogEntry>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCategory(organizationId, category) {
      return repo.list(organizationId).filter((entry) => entry.category === category);
    },
    async findByPublisher(organizationId, publisher) {
      return repo.list(organizationId).filter((entry) => entry.publisher === publisher);
    },
  };
}
