/** Real, in-memory Relationships repository. @module relationship/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DocumentRelationshipRepository } from './repository.js';
import type { DocumentRelationship } from './types.js';

/** Creates a real, in-memory {@link DocumentRelationshipRepository}. */
export function createDocumentRelationshipRepository(seed?: readonly DocumentRelationship[]): DocumentRelationshipRepository {
  const repo = createInMemoryRepository<DocumentRelationship>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByDocument(organizationId, documentId) {
      return repo.list(organizationId).filter((relationship) => relationship.documentId === documentId);
    },
    async findByRelatedEntity(organizationId, relatedEntityType, relatedEntityId) {
      return repo.list(organizationId).filter((relationship) => relationship.relatedEntityType === relatedEntityType && relationship.relatedEntityId === relatedEntityId);
    },
  };
}
