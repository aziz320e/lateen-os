/** @module metadata/repository */
import type { DocumentId } from '../document/types.js';
import type { Repository } from '../shared/repository.js';
import type { DocumentMetadataId, OrganizationId } from '../shared/identifiers.js';
import type { DocumentMetadata } from './types.js';

export interface DocumentMetadataRepository extends Repository<DocumentMetadata, DocumentMetadataId> {
  findAll(organizationId: OrganizationId): Promise<readonly DocumentMetadata[]>;
  findByDocument(organizationId: OrganizationId, documentId: DocumentId): Promise<DocumentMetadata | null>;
  findByCategory(organizationId: OrganizationId, category: string): Promise<readonly DocumentMetadata[]>;
  findByTag(organizationId: OrganizationId, tag: string): Promise<readonly DocumentMetadata[]>;
}
