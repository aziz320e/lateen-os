import type { SearchFilters, SearchHit, SearchRequest, SearchSource } from '../domain/types.js';

/** Source search adapter port — each platform source implements this contract. */
export interface SourceSearchAdapter {
  readonly source: SearchSource;
  search(request: SearchRequest): Promise<readonly SearchHit[]>;
  isAvailable(filters: SearchFilters): boolean;
}

export interface SourceSearchRegistry {
  register(adapter: SourceSearchAdapter): void;
  get(source: SearchSource): SourceSearchAdapter | undefined;
  listAvailable(filters: SearchFilters): readonly SourceSearchAdapter[];
}
