import type { SearchHit, SearchIntent, SearchMode, SearchRequest, SearchSource } from '../domain/types.js';

export interface RankingWeights {
  readonly exactMatch: number;
  readonly semanticSimilarity: number;
  readonly businessImportance: number;
  readonly popularity: number;
  readonly freshness: number;
  readonly relationshipDistance: number;
  readonly confidence: number;
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  exactMatch: 0.3,
  semanticSimilarity: 0.2,
  businessImportance: 0.15,
  popularity: 0.1,
  freshness: 0.1,
  relationshipDistance: 0.05,
  confidence: 0.1,
};

/** Ranking port — merges and scores search hits. */
export interface SearchRanker {
  rank(hits: readonly SearchHit[], request: SearchRequest, weights?: RankingWeights): readonly SearchHit[];
}

export function detectIntent(query: string, mode: SearchMode): SearchIntent {
  const q = query.toLowerCase();
  if (q.startsWith('ext:') || q.includes('marketplace')) return 'marketplace-browse';
  if (q.startsWith('workflow:') || q.includes('workflow')) return 'workflow-find';
  if (q.startsWith('mission:') || q.includes('mission')) return 'mission-find';
  if (q.startsWith('doc:') || q.includes('document')) return 'document-find';
  if (q.startsWith('org:') || q.includes('customer') || q.includes('product')) return 'entity-lookup';
  if (mode === 'graph') return 'entity-lookup';
  if (mode === 'semantic' || mode === 'vector') return 'knowledge-query';
  return 'general';
}

export function selectSources(intent: SearchIntent, requested?: readonly SearchSource[]): SearchSource[] {
  const all: SearchSource[] = requested?.length
    ? [...requested]
    : ['business-dna', 'knowledge-platform', 'institutional-memory', 'marketplace', 'documents', 'products', 'customers'];

  if (intent === 'marketplace-browse') return ['marketplace', 'extensions'];
  if (intent === 'workflow-find') return ['workflows', 'missions'];
  if (intent === 'mission-find') return ['missions', 'workflows'];
  if (intent === 'document-find') return ['knowledge-platform', 'documents', 'files', 'emails'];
  if (intent === 'knowledge-query') return ['knowledge-platform', 'institutional-memory', 'documents'];
  if (intent === 'entity-lookup') return ['business-dna', 'products', 'customers', 'projects'];
  return all;
}

export class DefaultSearchRanker implements SearchRanker {
  rank(hits: readonly SearchHit[], request: SearchRequest, weights: RankingWeights = DEFAULT_RANKING_WEIGHTS): readonly SearchHit[] {
    const q = request.query.toLowerCase();
    return [...hits]
      .map((hit) => {
        const exact = hit.title.toLowerCase().includes(q) ? weights.exactMatch : 0;
        const semantic = hit.score * weights.semanticSimilarity;
        const importance = (hit.metadata.businessImportance as number) ?? 0.5 * weights.businessImportance;
        const freshness = hit.createdAt
          ? Math.max(0, 1 - (Date.now() - new Date(hit.createdAt).getTime()) / (365 * 86400000)) * weights.freshness
          : 0;
        const score = hit.score + exact + semantic + importance + freshness;
        return { ...hit, score: Math.min(score, 1) };
      })
      .sort((a, b) => b.score - a.score);
  }
}
