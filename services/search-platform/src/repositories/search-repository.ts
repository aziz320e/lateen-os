import type { RecentSearch, SavedSearch, SearchCollection, SearchIndexInfo } from '../domain/types.js';

export interface SearchRepositoryPort {
  saveRecent(organizationId: string, userId: string, recent: RecentSearch): Promise<void>;
  listRecent(organizationId: string, userId: string, limit?: number): Promise<readonly RecentSearch[]>;
  saveSearch(search: SavedSearch): Promise<SavedSearch>;
  listSaved(organizationId: string, userId: string): Promise<readonly SavedSearch[]>;
  getSaved(id: string, organizationId: string): Promise<SavedSearch | null>;
  saveCollection(collection: SearchCollection): Promise<SearchCollection>;
  listCollections(organizationId: string, userId: string): Promise<readonly SearchCollection[]>;
  listIndexes(): Promise<readonly SearchIndexInfo[]>;
}
