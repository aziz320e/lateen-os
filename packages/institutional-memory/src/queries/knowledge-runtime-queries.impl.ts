/**
 * Real {@link KnowledgeRuntimeQueries} implementation — a CQRS read layer
 * composed over the Knowledge Entry repository and engines. Repositories
 * are taken as constructor dependencies but never returned to callers.
 *
 * @module queries/knowledge-runtime-queries.impl
 */
import type { KnowledgeRelationshipService } from '../knowledge/relationships.impl.js';
import type { KnowledgeEntryRepository } from '../knowledge/repository.js';
import type { RetentionEngine } from '../knowledge/retention.impl.js';
import type { KnowledgeSearchEngine } from '../knowledge/search.impl.js';
import type { KnowledgeEntry } from '../knowledge/types.js';
import type { KnowledgeRuntimeQueries } from './knowledge-runtime-queries.js';
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

export interface KnowledgeRuntimeQueriesDeps {
  readonly knowledgeEntryRepository: KnowledgeEntryRepository;
  readonly relationshipService: KnowledgeRelationshipService;
  readonly retentionEngine: RetentionEngine;
  readonly searchEngine: KnowledgeSearchEngine;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

async function findByType(
  deps: KnowledgeRuntimeQueriesDeps,
  query: FindTypedKnowledgeQuery,
  knowledgeType: KnowledgeEntry['knowledgeType'],
): Promise<FindKnowledgeResult> {
  const entries = await deps.knowledgeEntryRepository.findByType(query.organizationId, knowledgeType);
  return { entries: paginate(entries, query.offset, query.limit), total: entries.length };
}

/** Creates a real {@link KnowledgeRuntimeQueries} read port over the given repository and engines. */
export function createKnowledgeRuntimeQueries(deps: KnowledgeRuntimeQueriesDeps): KnowledgeRuntimeQueries {
  return {
    async findKnowledge(query: FindKnowledgeQuery): Promise<FindKnowledgeResult> {
      let entries;
      if (query.knowledgeType) {
        entries = await deps.knowledgeEntryRepository.findByType(query.organizationId, query.knowledgeType);
      } else if (query.status) {
        entries = await deps.knowledgeEntryRepository.findByStatus(query.organizationId, query.status);
      } else {
        entries = await deps.knowledgeEntryRepository.findByOrganization(query.organizationId);
      }
      const filtered = query.category ? entries.filter((entry) => entry.category === query.category) : entries;
      return { entries: paginate(filtered, query.offset, query.limit), total: filtered.length };
    },

    findPolicies: (query) => findByType(deps, query, 'policy'),
    findPlaybooks: (query) => findByType(deps, query, 'playbook'),
    findLessonsLearned: (query) => findByType(deps, query, 'lesson_learned'),
    findTemplates: (query) => findByType(deps, query, 'template'),

    async findRelatedKnowledge(query: FindRelatedKnowledgeQuery): Promise<FindRelatedKnowledgeResult> {
      const entry = await deps.knowledgeEntryRepository.findById(query.organizationId, query.knowledgeEntryId);
      if (!entry) return { entries: [] };

      const related = new Map<string, KnowledgeEntry>();
      for (const relatedId of entry.relatedKnowledgeEntryIds) {
        const relatedEntry = await deps.knowledgeEntryRepository.findById(query.organizationId, relatedId);
        if (relatedEntry) related.set(relatedEntry.id, relatedEntry);
      }
      if (entry.parentKnowledgeEntryId) {
        const parent = await deps.knowledgeEntryRepository.findById(query.organizationId, entry.parentKnowledgeEntryId);
        if (parent) related.set(parent.id, parent);
      }
      for (const child of await deps.relationshipService.getChildren(query.organizationId, entry.id)) {
        related.set(child.id, child);
      }
      related.delete(entry.id);
      return { entries: [...related.values()] };
    },

    async findExpiringKnowledge(query: FindExpiringKnowledgeQuery): Promise<FindExpiringKnowledgeResult> {
      return { entries: await deps.retentionEngine.findExpiring(query.organizationId, query.withinDays, query.at) };
    },

    async searchKnowledge(params: SearchKnowledgeParams): Promise<SearchKnowledgeResult> {
      const matches = await deps.searchEngine.search(params.organizationId, params);
      return { matches, total: matches.length };
    },
  };
}
