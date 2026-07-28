/** Real, in-memory Metadata repository. @module metadata/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DocumentMetadataRepository } from './repository.js';
import type { DocumentMetadata } from './types.js';

/** Creates a real, in-memory {@link DocumentMetadataRepository}. */
export function createDocumentMetadataRepository(seed?: readonly DocumentMetadata[]): DocumentMetadataRepository {
  const repo = createInMemoryRepository<DocumentMetadata>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByDocument(organizationId, documentId) {
      return repo.list(organizationId).find((metadata) => metadata.documentId === documentId) ?? null;
    },
    async findByCategory(organizationId, category) {
      return repo.list(organizationId).filter((metadata) => metadata.categories.includes(category));
    },
    async findByTag(organizationId, tag) {
      return repo.list(organizationId).filter((metadata) => metadata.tags.includes(tag));
    },
  };
}
