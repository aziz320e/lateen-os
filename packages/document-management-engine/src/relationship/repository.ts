/** @module relationship/repository */
import type { DocumentId } from '../document/types.js';
import type { Repository } from '../shared/repository.js';
import type { DocumentRelationshipId, OrganizationId } from '../shared/identifiers.js';
import type { DocumentRelationship, RelatedEntityType } from './types.js';

export interface DocumentRelationshipRepository extends Repository<DocumentRelationship, DocumentRelationshipId> {
  findAll(organizationId: OrganizationId): Promise<readonly DocumentRelationship[]>;
  findByDocument(organizationId: OrganizationId, documentId: DocumentId): Promise<readonly DocumentRelationship[]>;
  findByRelatedEntity(organizationId: OrganizationId, relatedEntityType: RelatedEntityType, relatedEntityId: string): Promise<readonly DocumentRelationship[]>;
}
