/**
 * Real {@link DocumentManagementQueries} implementation — a CQRS read
 * layer composed over the Document Management Engine repositories.
 * Repositories are taken as constructor dependencies but never
 * returned to callers.
 *
 * @module queries/document-management-queries.impl
 */
import type { DocumentRepository } from '../document/repository.js';
import type { FolderRepository } from '../folder/repository.js';
import type { DocumentMetadataRepository } from '../metadata/repository.js';
import type { DocumentRelationshipRepository } from '../relationship/repository.js';
import type { DocumentVersionRepository } from '../version/repository.js';
import type { DocumentManagementQueries } from './document-management-queries.js';
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
  SearchDocumentsMatch,
  SearchDocumentsQuery,
  SearchDocumentsResult,
} from './types.js';

export interface DocumentManagementQueriesDeps {
  readonly documentRepository: DocumentRepository;
  readonly folderRepository: FolderRepository;
  readonly versionRepository: DocumentVersionRepository;
  readonly metadataRepository: DocumentMetadataRepository;
  readonly relationshipRepository: DocumentRelationshipRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}

/** Creates a real {@link DocumentManagementQueries} read port over the given repositories. */
export function createDocumentManagementQueries(deps: DocumentManagementQueriesDeps): DocumentManagementQueries {
  return {
    async findDocuments(query: FindDocumentsQuery): Promise<FindDocumentsResult> {
      let documents = query.folderId
        ? await deps.documentRepository.findByFolder(query.organizationId, query.folderId)
        : query.documentType
          ? await deps.documentRepository.findByType(query.organizationId, query.documentType)
          : query.ownerId
            ? await deps.documentRepository.findByOwner(query.organizationId, query.ownerId)
            : await deps.documentRepository.findAll(query.organizationId);
      if (query.status) documents = documents.filter((document) => document.status === query.status);
      return { documents: paginate(documents, query.offset, query.limit), total: documents.length };
    },

    async findFolders(query: FindFoldersQuery): Promise<FindFoldersResult> {
      let folders = query.parentFolderId
        ? await deps.folderRepository.findByParent(query.organizationId, query.parentFolderId)
        : await deps.folderRepository.findAll(query.organizationId);
      if (query.status) folders = folders.filter((folder) => folder.status === query.status);
      return { folders: paginate(folders, query.offset, query.limit), total: folders.length };
    },

    async findVersions(query: FindVersionsQuery): Promise<FindVersionsResult> {
      const versions = query.documentId
        ? await deps.versionRepository.findByDocument(query.organizationId, query.documentId)
        : await deps.versionRepository.findAll(query.organizationId);
      return { versions: paginate(versions, query.offset, query.limit), total: versions.length };
    },

    async findMetadata(query: FindMetadataQuery): Promise<FindMetadataResult> {
      let metadata = query.documentId
        ? await deps.metadataRepository.findByDocument(query.organizationId, query.documentId).then((found) => (found ? [found] : []))
        : query.category
          ? await deps.metadataRepository.findByCategory(query.organizationId, query.category)
          : query.tag
            ? await deps.metadataRepository.findByTag(query.organizationId, query.tag)
            : await deps.metadataRepository.findAll(query.organizationId);
      return { metadata: paginate(metadata, query.offset, query.limit), total: metadata.length };
    },

    async findRelationships(query: FindRelationshipsQuery): Promise<FindRelationshipsResult> {
      let relationships = query.documentId
        ? await deps.relationshipRepository.findByDocument(query.organizationId, query.documentId)
        : query.relatedEntityType && query.relatedEntityId
          ? await deps.relationshipRepository.findByRelatedEntity(query.organizationId, query.relatedEntityType, query.relatedEntityId)
          : await deps.relationshipRepository.findAll(query.organizationId);
      if (query.relatedEntityType && query.documentId) {
        relationships = relationships.filter((relationship) => relationship.relatedEntityType === query.relatedEntityType);
      }
      return { relationships: paginate(relationships, query.offset, query.limit), total: relationships.length };
    },

    async searchDocuments(query: SearchDocumentsQuery): Promise<SearchDocumentsResult> {
      const [documents, folders, allMetadata] = await Promise.all([
        deps.documentRepository.findAll(query.organizationId),
        deps.folderRepository.findAll(query.organizationId),
        deps.metadataRepository.findAll(query.organizationId),
      ]);
      const metadataByDocument = new Map(allMetadata.map((metadata) => [metadata.documentId, metadata] as const));

      const matches: SearchDocumentsMatch[] = [];
      for (const document of documents) {
        const metadata = metadataByDocument.get(document.id);
        const scores = [
          scoreLabel(document.title, query.keyword),
          document.ownerId ? scoreLabel(document.ownerId, query.keyword) : 0,
          ...(metadata?.tags.map((tag) => scoreLabel(tag, query.keyword)) ?? []),
          ...(metadata?.categories.map((category) => scoreLabel(category, query.keyword)) ?? []),
          ...(metadata?.owners.map((owner) => scoreLabel(owner, query.keyword)) ?? []),
        ];
        const score = Math.max(...scores);
        if (score > 0) matches.push({ recordType: 'document', id: document.id, label: document.title, score });
      }
      for (const folder of folders) {
        const score = scoreLabel(folder.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'folder', id: folder.id, label: folder.name, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      const limited = query.limit === undefined ? matches : matches.slice(0, query.limit);
      return { matches: limited, total: matches.length };
    },
  };
}
