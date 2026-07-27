/** @module queries/knowledge-runtime-queries */
import type {
  FindExpiringKnowledgeQuery,
  FindExpiringKnowledgeResult,
  FindKnowledgeQuery,
  FindKnowledgeResult,
  FindRelatedKnowledgeQuery,
  FindRelatedKnowledgeResult,
  FindTypedKnowledgeQuery,
  SearchKnowledgeParams,
  SearchKnowledgeResult,
} from './knowledge-runtime-types.js';

/**
 * Real-time read-side query port for the Institutional Memory runtime.
 * Composed purely over repositories and engines — never exposes a
 * repository directly.
 */
export interface KnowledgeRuntimeQueries {
  findKnowledge(query: FindKnowledgeQuery): Promise<FindKnowledgeResult>;

  findPolicies(query: FindTypedKnowledgeQuery): Promise<FindKnowledgeResult>;

  findPlaybooks(query: FindTypedKnowledgeQuery): Promise<FindKnowledgeResult>;

  findLessonsLearned(query: FindTypedKnowledgeQuery): Promise<FindKnowledgeResult>;

  findTemplates(query: FindTypedKnowledgeQuery): Promise<FindKnowledgeResult>;

  findRelatedKnowledge(query: FindRelatedKnowledgeQuery): Promise<FindRelatedKnowledgeResult>;

  findExpiringKnowledge(query: FindExpiringKnowledgeQuery): Promise<FindExpiringKnowledgeResult>;

  searchKnowledge(params: SearchKnowledgeParams): Promise<SearchKnowledgeResult>;
}
