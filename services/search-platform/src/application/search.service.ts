import { randomUUID } from 'node:crypto';
import type { SearchHit, SearchRequest, SearchResponse, SearchSource } from '../domain/types.js';
import type { SourceSearchAdapter, SourceSearchRegistry } from '../sources/source-adapter.js';
import { detectIntent, DefaultSearchRanker, selectSources } from '../ranking/ranker.js';
import { DefaultPermissionFilter } from '../permissions/permission-filter.js';
import { DefaultSearchHighlighter } from '../highlight/highlighter.js';
import type { SearchRepositoryPort } from '../repositories/search-repository.js';

export class InMemorySourceRegistry implements SourceSearchRegistry {
  private readonly adapters = new Map<SearchSource, SourceSearchAdapter>();

  register(adapter: SourceSearchAdapter): void {
    this.adapters.set(adapter.source, adapter);
  }

  get(source: SearchSource): SourceSearchAdapter | undefined {
    return this.adapters.get(source);
  }

  listAvailable(filters: SearchRequest['filters']): readonly SourceSearchAdapter[] {
    return [...this.adapters.values()].filter((a) => a.isAvailable(filters));
  }
}

export class SearchService {
  private readonly ranker = new DefaultSearchRanker();
  private readonly permissionFilter = new DefaultPermissionFilter();
  private readonly highlighter = new DefaultSearchHighlighter();

  constructor(
    private readonly registry: SourceSearchRegistry,
    private readonly repo: SearchRepositoryPort,
  ) {}

  async search(request: SearchRequest): Promise<SearchResponse> {
    const started = Date.now();
    const correlationId = request.correlationId ?? randomUUID();

    const intent = detectIntent(request.query, request.mode);
    const sourceIds = selectSources(intent, request.filters.sources);
    const adapters = this.registry.listAvailable(request.filters).filter((a) => sourceIds.includes(a.source));

    const results = await Promise.all(adapters.map((a) => a.search(request)));
    let hits: SearchHit[] = results.flat();

    hits = [...this.ranker.rank(hits, request)];
    hits = [...this.permissionFilter.filter(hits, {
      organizationId: request.filters.organizationId,
      userId: request.userId,
      roles: request.userId ? ['user'] : [],
      department: request.filters.department,
    }, request)];
    hits = [...this.highlighter.highlight(hits, request.query)];

    const offset = request.offset ?? 0;
    const limit = request.limit ?? 20;
    const paged = hits.slice(offset, offset + limit);

    if (request.userId) {
      await this.repo.saveRecent(request.filters.organizationId, request.userId, {
        query: request.query,
        mode: request.mode,
        searchedAt: new Date().toISOString(),
        hitCount: hits.length,
      });
    }

    return {
      query: request.query,
      mode: request.mode,
      intent,
      total: hits.length,
      hits: paged,
      sourcesQueried: adapters.map((a) => a.source),
      latencyMs: Date.now() - started,
      correlationId,
    };
  }

  async suggestions(query: string, organizationId: string) {
    if (!query.trim()) return [];
    const recent = await this.repo.listRecent(organizationId, 'anonymous', 5);
    return recent
      .filter((r) => r.query.toLowerCase().includes(query.toLowerCase()))
      .map((r) => ({ text: r.query, score: 0.8 }));
  }

  async recent(organizationId: string, userId: string) {
    return this.repo.listRecent(organizationId, userId);
  }

  async saved(organizationId: string, userId: string) {
    return this.repo.listSaved(organizationId, userId);
  }

  async indexes() {
    return this.repo.listIndexes();
  }
}
