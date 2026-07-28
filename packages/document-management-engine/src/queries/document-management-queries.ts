/** @module queries/document-management-queries */
import type {
  FindDocumentsQuery,
  FindDocumentsResult,
  FindFoldersQuery,
  FindFoldersResult,
  FindMetadataQuery,
  FindMetadataResult,
  FindRelationshipsQuery,
  FindRelationshipsResult,
  FindVersionsQuery,
  FindVersionsResult,
  SearchDocumentsQuery,
  SearchDocumentsResult,
} from './types.js';

/** Real, read-only Document Management Engine query port. */
export interface DocumentManagementQueries {
  findDocuments(query: FindDocumentsQuery): Promise<FindDocumentsResult>;
  findFolders(query: FindFoldersQuery): Promise<FindFoldersResult>;
  findVersions(query: FindVersionsQuery): Promise<FindVersionsResult>;
  findMetadata(query: FindMetadataQuery): Promise<FindMetadataResult>;
  findRelationships(query: FindRelationshipsQuery): Promise<FindRelationshipsResult>;
  searchDocuments(query: SearchDocumentsQuery): Promise<SearchDocumentsResult>;
}
