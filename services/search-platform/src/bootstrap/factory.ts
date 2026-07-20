import { SearchService, InMemorySourceRegistry } from '../application/search.service';
import { createDefaultSourceAdapters } from '../sources/stub-adapters';
import { InMemorySearchRepository } from '../repositories/in-memory-repository';

export function createSearchService(): SearchService {
  const registry = new InMemorySourceRegistry();
  for (const adapter of createDefaultSourceAdapters()) {
    registry.register(adapter);
  }
  return new SearchService(registry, new InMemorySearchRepository());
}
