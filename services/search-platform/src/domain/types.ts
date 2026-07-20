/** Enterprise Search domain contracts — orchestration only, no AI reasoning. */

export type SearchSource =
  | 'business-dna'
  | 'institutional-memory'
  | 'knowledge-platform'
  | 'marketplace'
  | 'projects'
  | 'customers'
  | 'products'
  | 'orders'
  | 'invoices'
  | 'workflows'
  | 'missions'
  | 'ai-conversations'
  | 'extensions'
  | 'connectors'
  | 'reports'
  | 'files'
  | 'emails'
  | 'documents';

export type SearchMode =
  | 'keyword'
  | 'semantic'
  | 'hybrid'
  | 'vector'
  | 'metadata'
  | 'graph'
  | 'recent'
  | 'saved';

export type SearchIntent =
  | 'general'
  | 'entity-lookup'
  | 'document-find'
  | 'knowledge-query'
  | 'marketplace-browse'
  | 'workflow-find'
  | 'mission-find';

export type RankingSignal =
  | 'exact-match'
  | 'semantic-similarity'
  | 'business-importance'
  | 'popularity'
  | 'freshness'
  | 'relationship-distance'
  | 'confidence';

export interface SearchFilters {
  readonly organizationId: string;
  readonly department?: string;
  readonly entityType?: string;
  readonly tags?: readonly string[];
  readonly owner?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly knowledgeType?: string;
  readonly workflow?: string;
  readonly mission?: string;
  readonly aiWorker?: string;
  readonly extension?: string;
  readonly marketplace?: boolean;
  readonly sources?: readonly SearchSource[];
}

export interface SearchRequest {
  readonly query: string;
  readonly mode: SearchMode;
  readonly filters: SearchFilters;
  readonly limit?: number;
  readonly offset?: number;
  readonly userId?: string;
  readonly correlationId?: string;
}

export interface SearchHitHighlight {
  readonly field: string;
  readonly snippet: string;
}

export interface SearchHit {
  readonly id: string;
  readonly source: SearchSource;
  readonly title: string;
  readonly description?: string;
  readonly entityType?: string;
  readonly url?: string;
  readonly score: number;
  readonly highlights: readonly SearchHitHighlight[];
  readonly metadata: Record<string, unknown>;
  readonly createdAt?: string;
}

export interface SearchResponse {
  readonly query: string;
  readonly mode: SearchMode;
  readonly intent: SearchIntent;
  readonly total: number;
  readonly hits: readonly SearchHit[];
  readonly sourcesQueried: readonly SearchSource[];
  readonly latencyMs: number;
  readonly correlationId: string;
}

export interface SearchSuggestion {
  readonly text: string;
  readonly source?: SearchSource;
  readonly score: number;
}

export interface SavedSearch {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly name: string;
  readonly query: string;
  readonly mode: SearchMode;
  readonly filters: SearchFilters;
  readonly pinned: boolean;
  readonly createdAt: string;
}

export interface SearchCollection {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly name: string;
  readonly searchIds: readonly string[];
  readonly createdAt: string;
}

export interface RecentSearch {
  readonly query: string;
  readonly mode: SearchMode;
  readonly searchedAt: string;
  readonly hitCount: number;
}

export interface SearchIndexInfo {
  readonly source: SearchSource;
  readonly name: string;
  readonly documentCount: number;
  readonly lastIndexedAt?: string;
  readonly status: 'active' | 'indexing' | 'unavailable';
}

export const SEARCH_SOURCES: readonly SearchSource[] = [
  'business-dna', 'institutional-memory', 'knowledge-platform', 'marketplace',
  'projects', 'customers', 'products', 'orders', 'invoices', 'workflows',
  'missions', 'ai-conversations', 'extensions', 'connectors', 'reports',
  'files', 'emails', 'documents',
];

export const SEARCH_MODES: readonly SearchMode[] = [
  'keyword', 'semantic', 'hybrid', 'vector', 'metadata', 'graph', 'recent', 'saved',
];

export const PIPELINE_STEPS = [
  'receive-query',
  'intent-detection',
  'source-selection',
  'business-dna-search',
  'knowledge-search',
  'memory-search',
  'graph-search',
  'marketplace-search',
  'merge-results',
  'ranking',
  'permission-filtering',
  'highlight',
  'return',
] as const;

export type PipelineStepId = (typeof PIPELINE_STEPS)[number];
