/** @module queries/types */
import type { Document, DocumentId, DocumentStatus, DocumentType, FolderId } from '../document/types.js';
import type { Folder, FolderStatus } from '../folder/types.js';
import type { DocumentMetadata, DocumentMetadataId } from '../metadata/types.js';
import type { DocumentRelationship, DocumentRelationshipId, RelatedEntityType } from '../relationship/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { DocumentVersion, DocumentVersionId } from '../version/types.js';

export interface FindDocumentsQuery extends OrganizationScopedQuery {
  readonly folderId?: FolderId;
  readonly documentType?: DocumentType;
  readonly status?: DocumentStatus;
  readonly ownerId?: string;
}

export interface FindDocumentsResult {
  readonly documents: readonly Document[];
  readonly total: number;
}

export interface FindFoldersQuery extends OrganizationScopedQuery {
  readonly parentFolderId?: FolderId;
  readonly status?: FolderStatus;
}

export interface FindFoldersResult {
  readonly folders: readonly Folder[];
  readonly total: number;
}

export interface FindVersionsQuery extends OrganizationScopedQuery {
  readonly documentId?: DocumentId;
}

export interface FindVersionsResult {
  readonly versions: readonly DocumentVersion[];
  readonly total: number;
}

export interface FindMetadataQuery extends OrganizationScopedQuery {
  readonly documentId?: DocumentId;
  readonly category?: string;
  readonly tag?: string;
}

export interface FindMetadataResult {
  readonly metadata: readonly DocumentMetadata[];
  readonly total: number;
}

export interface FindRelationshipsQuery extends OrganizationScopedQuery {
  readonly documentId?: DocumentId;
  readonly relatedEntityType?: RelatedEntityType;
  readonly relatedEntityId?: string;
}

export interface FindRelationshipsResult {
  readonly relationships: readonly DocumentRelationship[];
  readonly total: number;
}

export interface SearchDocumentsQuery extends OrganizationScopedQuery {
  readonly keyword: string;
}

export type SearchDocumentsRecordType = 'document' | 'folder';

export interface SearchDocumentsMatch {
  readonly recordType: SearchDocumentsRecordType;
  readonly id: DocumentId | FolderId | DocumentVersionId | DocumentMetadataId | DocumentRelationshipId;
  readonly label: string;
  readonly score: number;
}

export interface SearchDocumentsResult {
  readonly matches: readonly SearchDocumentsMatch[];
  readonly total: number;
}

export type { OrganizationId };
