/** Real, in-memory Document Lifecycle repository. @module document/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DocumentRepository } from './repository.js';
import type { Document } from './types.js';

/** Creates a real, in-memory {@link DocumentRepository}. */
export function createDocumentRepository(seed?: readonly Document[]): DocumentRepository {
  const repo = createInMemoryRepository<Document>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByFolder(organizationId, folderId) {
      return repo.list(organizationId).filter((document) => document.folderId === folderId);
    },
    async findByType(organizationId, documentType) {
      return repo.list(organizationId).filter((document) => document.documentType === documentType);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((document) => document.status === status);
    },
    async findByOwner(organizationId, ownerId) {
      return repo.list(organizationId).filter((document) => document.ownerId === ownerId);
    },
  };
}
