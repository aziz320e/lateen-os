/** @module version/repository */
import type { DocumentId } from '../document/types.js';
import type { Repository } from '../shared/repository.js';
import type { DocumentVersionId, OrganizationId } from '../shared/identifiers.js';
import type { DocumentVersion } from './types.js';

export interface DocumentVersionRepository extends Repository<DocumentVersion, DocumentVersionId> {
  findAll(organizationId: OrganizationId): Promise<readonly DocumentVersion[]>;
  findByDocument(organizationId: OrganizationId, documentId: DocumentId): Promise<readonly DocumentVersion[]>;
  findByDocumentAndVersionNumber(organizationId: OrganizationId, documentId: DocumentId, versionNumber: number): Promise<DocumentVersion | null>;
}
