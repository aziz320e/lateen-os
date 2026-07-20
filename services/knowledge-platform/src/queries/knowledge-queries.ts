import type { KnowledgeDocument, KnowledgeType, SourceType } from '../domain/types.js';

export interface FindDocumentQuery {
  readonly organizationId: string;
  readonly documentId: string;
}

export interface FindKnowledgeQuery {
  readonly organizationId: string;
  readonly query: string;
  readonly limit?: number;
}

export interface FindByEntityQuery {
  readonly organizationId: string;
  readonly entityType: string;
  readonly entityId: string;
}

export interface FindByBusinessDnaQuery {
  readonly organizationId: string;
  readonly entityId: string;
}

export interface FindByDepartmentQuery {
  readonly organizationId: string;
  readonly department: string;
  readonly limit?: number;
}

export interface FindByTagsQuery {
  readonly organizationId: string;
  readonly tags: readonly string[];
  readonly matchAll?: boolean;
}

export interface FindRelatedDocumentsQuery {
  readonly organizationId: string;
  readonly documentId: string;
  readonly limit?: number;
}

export interface FindRecentKnowledgeQuery {
  readonly organizationId: string;
  readonly limit?: number;
  readonly knowledgeType?: KnowledgeType;
}

export interface KnowledgeSearchResult {
  readonly documents: readonly KnowledgeDocument[];
  readonly total: number;
}

/** Read-side knowledge query port. */
export interface KnowledgeQueries {
  findDocument(query: FindDocumentQuery): Promise<KnowledgeDocument | null>;
  findKnowledge(query: FindKnowledgeQuery): Promise<KnowledgeSearchResult>;
  findByEntity(query: FindByEntityQuery): Promise<KnowledgeSearchResult>;
  findByBusinessDna(query: FindByBusinessDnaQuery): Promise<KnowledgeSearchResult>;
  findByDepartment(query: FindByDepartmentQuery): Promise<KnowledgeSearchResult>;
  findByTags(query: FindByTagsQuery): Promise<KnowledgeSearchResult>;
  findRelatedDocuments(query: FindRelatedDocumentsQuery): Promise<KnowledgeSearchResult>;
  findRecentKnowledge(query: FindRecentKnowledgeQuery): Promise<KnowledgeSearchResult>;
  listSources(): readonly SourceType[];
}
