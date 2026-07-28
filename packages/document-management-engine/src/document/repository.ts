/** @module document/repository */
import type { Repository } from '../shared/repository.js';
import type { DocumentId, FolderId, OrganizationId } from '../shared/identifiers.js';
import type { Document, DocumentStatus, DocumentType } from './types.js';

export interface DocumentRepository extends Repository<Document, DocumentId> {
  findAll(organizationId: OrganizationId): Promise<readonly Document[]>;
  findByFolder(organizationId: OrganizationId, folderId: FolderId): Promise<readonly Document[]>;
  findByType(organizationId: OrganizationId, documentType: DocumentType): Promise<readonly Document[]>;
  findByStatus(organizationId: OrganizationId, status: DocumentStatus): Promise<readonly Document[]>;
  findByOwner(organizationId: OrganizationId, ownerId: string): Promise<readonly Document[]>;
}
