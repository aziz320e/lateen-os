/**
 * Real Memory Search — deterministic keyword search over title/content,
 * with tag/category/source/type/status filtering and relevance ranking.
 * Pure string matching: no embeddings, no vector database, no AI/LLM.
 *
 * @module knowledge/search.impl
 */
import type { MemoryCategory } from '../classification/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { MemorySourceLabel, MemoryTag } from '../shared/primitives.js';
import type { KnowledgeEntryRepository } from './repository.js';
import type { KnowledgeEntry, KnowledgeEntryStatus, KnowledgeType } from './types.js';

export interface SearchKnowledgeQuery {
  readonly keyword?: string;
  readonly tags?: readonly MemoryTag[];
  readonly category?: MemoryCategory;
  readonly source?: MemorySourceLabel;
  readonly knowledgeType?: KnowledgeType;
  readonly status?: KnowledgeEntryStatus;
  readonly limit?: number;
}

export interface KnowledgeSearchMatch {
  readonly entry: KnowledgeEntry;
  readonly score: number;
}

export interface KnowledgeSearchEngine {
  search(organizationId: OrganizationId, query: SearchKnowledgeQuery): Promise<readonly KnowledgeSearchMatch[]>;
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  return haystack.split(needle).length - 1;
}

function tokenize(keyword: string): readonly string[] {
  return keyword
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function scoreEntry(entry: KnowledgeEntry, tokens: readonly string[]): number {
  const title = entry.title.toLowerCase();
  const content = entry.content.toLowerCase();
  const tags = entry.tags.map((tag) => tag.toLowerCase());
  let score = 0;
  for (const token of tokens) {
    score += countOccurrences(title, token) * 3;
    score += countOccurrences(content, token) * 1;
    score += tags.filter((tag) => tag === token).length * 2;
  }
  return score;
}

/** Creates a real {@link KnowledgeSearchEngine} over a {@link KnowledgeEntryRepository}. */
export function createKnowledgeSearchEngine(repository: KnowledgeEntryRepository): KnowledgeSearchEngine {
  return {
    async search(organizationId, query) {
      const all = await repository.findByOrganization(organizationId);
      const tagFilter = query.tags && query.tags.length > 0 ? new Set(query.tags) : undefined;

      const filtered = all
        .filter((entry) => (query.category ? entry.category === query.category : true))
        .filter((entry) => (query.source ? entry.source === query.source : true))
        .filter((entry) => (query.knowledgeType ? entry.knowledgeType === query.knowledgeType : true))
        .filter((entry) => (query.status ? entry.status === query.status : true))
        .filter((entry) => (tagFilter ? entry.tags.some((tag) => tagFilter.has(tag)) : true));

      const tokens = query.keyword ? tokenize(query.keyword) : [];
      const scored: KnowledgeSearchMatch[] = [];
      for (const entry of filtered) {
        const score = tokens.length > 0 ? scoreEntry(entry, tokens) : 1;
        if (tokens.length > 0 && score === 0) continue;
        scored.push({ entry, score });
      }

      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.entry.updatedAt !== b.entry.updatedAt) return a.entry.updatedAt < b.entry.updatedAt ? 1 : -1;
        return a.entry.id < b.entry.id ? -1 : a.entry.id > b.entry.id ? 1 : 0;
      });

      return query.limit === undefined ? scored : scored.slice(0, query.limit);
    },
  };
}
