import type {
  FindByBusinessDnaQuery,
  FindByDepartmentQuery,
  FindByEntityQuery,
  FindByTagsQuery,
  FindDocumentQuery,
  FindKnowledgeQuery,
  FindRecentKnowledgeQuery,
  FindRelatedDocumentsQuery,
  KnowledgeQueries,
  KnowledgeSearchResult,
} from './knowledge-queries.js';
import type { KnowledgeRepositoryPort } from '../repositories/knowledge-repository.js';
import { SUPPORTED_SOURCE_TYPES } from '../domain/types.js';

export class InMemoryKnowledgeQueries implements KnowledgeQueries {
  constructor(private readonly repo: KnowledgeRepositoryPort) {}

  async findDocument(query: FindDocumentQuery) {
    return this.repo.findDocument(query.documentId, query.organizationId);
  }

  async findKnowledge(query: FindKnowledgeQuery): Promise<KnowledgeSearchResult> {
    const docs = await this.repo.listDocuments(query.organizationId);
    const filtered = docs.filter((d) =>
      d.title.toLowerCase().includes(query.query.toLowerCase()),
    );
    return { documents: filtered.slice(0, query.limit ?? 20), total: filtered.length };
  }

  async findByEntity(query: FindByEntityQuery): Promise<KnowledgeSearchResult> {
    const docs = await this.repo.listDocuments(query.organizationId);
    const filtered = docs.filter((d) =>
      d.links?.domainGraphNodeIds?.some((id) => id.includes(query.entityId)),
    );
    return { documents: filtered, total: filtered.length };
  }

  async findByBusinessDna(query: FindByBusinessDnaQuery): Promise<KnowledgeSearchResult> {
    const docs = await this.repo.listDocuments(query.organizationId);
    const filtered = docs.filter((d) =>
      d.links?.businessDnaEntityIds?.some((id) => id.includes(query.entityId)),
    );
    return { documents: filtered, total: filtered.length };
  }

  async findByDepartment(query: FindByDepartmentQuery): Promise<KnowledgeSearchResult> {
    const docs = await this.repo.listDocuments(query.organizationId);
    const filtered = docs.filter((d) => d.department === query.department);
    return { documents: filtered.slice(0, query.limit ?? 20), total: filtered.length };
  }

  async findByTags(query: FindByTagsQuery): Promise<KnowledgeSearchResult> {
    const docs = await this.repo.listDocuments(query.organizationId);
    const filtered = docs.filter((d) => {
      if (query.matchAll) return query.tags.every((t) => d.tags.includes(t));
      return query.tags.some((t) => d.tags.includes(t));
    });
    return { documents: filtered, total: filtered.length };
  }

  async findRelatedDocuments(query: FindRelatedDocumentsQuery): Promise<KnowledgeSearchResult> {
    const doc = await this.repo.findDocument(query.documentId, query.organizationId);
    if (!doc) return { documents: [], total: 0 };
    const docs = await this.repo.listDocuments(query.organizationId);
    const filtered = docs.filter(
      (d) =>
        d.id !== doc.id &&
        (d.department === doc.department || d.tags.some((t) => doc.tags.includes(t))),
    );
    return { documents: filtered.slice(0, query.limit ?? 10), total: filtered.length };
  }

  async findRecentKnowledge(query: FindRecentKnowledgeQuery): Promise<KnowledgeSearchResult> {
    const docs = await this.repo.listDocuments(query.organizationId);
    const filtered = query.knowledgeType
      ? docs.filter((d) => d.knowledgeType === query.knowledgeType)
      : docs;
    const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { documents: sorted.slice(0, query.limit ?? 20), total: sorted.length };
  }

  listSources() {
    return SUPPORTED_SOURCE_TYPES;
  }
}
