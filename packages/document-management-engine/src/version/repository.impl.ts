/** Real, in-memory Version Control repository. @module version/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DocumentVersionRepository } from './repository.js';
import type { DocumentVersion } from './types.js';

/** Creates a real, in-memory {@link DocumentVersionRepository}. */
export function createDocumentVersionRepository(seed?: readonly DocumentVersion[]): DocumentVersionRepository {
  const repo = createInMemoryRepository<DocumentVersion>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByDocument(organizationId, documentId) {
      return repo.list(organizationId).filter((version) => version.documentId === documentId);
    },
    async findByDocumentAndVersionNumber(organizationId, documentId, versionNumber) {
      return repo.list(organizationId).find((version) => version.documentId === documentId && version.versionNumber === versionNumber) ?? null;
    },
  };
}
