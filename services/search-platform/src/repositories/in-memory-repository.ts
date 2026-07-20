import { randomUUID } from 'node:crypto';
import type {
  RecentSearch,
  SavedSearch,
  SearchCollection,
  SearchIndexInfo,
  SearchSource,
} from '../domain/types.js';
import { SEARCH_SOURCES } from '../domain/types.js';
import type { SearchRepositoryPort } from './search-repository.js';

export class InMemorySearchRepository implements SearchRepositoryPort {
  private readonly recent = new Map<string, RecentSearch[]>();
  private readonly saved = new Map<string, SavedSearch>();
  private readonly collections = new Map<string, SearchCollection>();

  private key(org: string, user: string) {
    return `${org}:${user}`;
  }

  async saveRecent(organizationId: string, userId: string, recent: RecentSearch): Promise<void> {
    const k = this.key(organizationId, userId);
    const list = this.recent.get(k) ?? [];
    list.unshift(recent);
    this.recent.set(k, list.slice(0, 50));
  }

  async listRecent(organizationId: string, userId: string, limit = 20): Promise<readonly RecentSearch[]> {
    return (this.recent.get(this.key(organizationId, userId)) ?? []).slice(0, limit);
  }

  async saveSearch(search: SavedSearch): Promise<SavedSearch> {
    this.saved.set(search.id, search);
    return search;
  }

  async listSaved(organizationId: string, userId: string): Promise<readonly SavedSearch[]> {
    return [...this.saved.values()].filter((s) => s.organizationId === organizationId && s.userId === userId);
  }

  async getSaved(id: string, organizationId: string): Promise<SavedSearch | null> {
    const s = this.saved.get(id);
    if (!s || s.organizationId !== organizationId) return null;
    return s;
  }

  async saveCollection(collection: SearchCollection): Promise<SearchCollection> {
    this.collections.set(collection.id, collection);
    return collection;
  }

  async listCollections(organizationId: string, userId: string): Promise<readonly SearchCollection[]> {
    return [...this.collections.values()].filter((c) => c.organizationId === organizationId && c.userId === userId);
  }

  async listIndexes(): Promise<readonly SearchIndexInfo[]> {
    return SEARCH_SOURCES.map((source: SearchSource) => ({
      source,
      name: source.replace(/-/g, ' '),
      documentCount: 0,
      status: 'active' as const,
    }));
  }
}

export { randomUUID };
