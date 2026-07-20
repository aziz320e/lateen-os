import { embeddingRequestSchema } from '@lateen-os/ai-provider-hub';
import type { SearchSource } from '../domain/types.js';

export { embeddingRequestSchema };

/** Qdrant vector search request contract — no implementation. */
export interface VectorSearchRequest {
  readonly organizationId: string;
  readonly collection: string;
  readonly queryVector: readonly number[];
  readonly limit: number;
  readonly filter?: Record<string, unknown>;
}

export interface VectorSearchResult {
  readonly id: string;
  readonly score: number;
  readonly payload: Record<string, unknown>;
}

/** Qdrant adapter port — contract only. */
export interface QdrantSearchAdapter {
  search(request: VectorSearchRequest): Promise<readonly VectorSearchResult[]>;
  collectionName(organizationId: string, source: SearchSource): string;
  getIndexStatus(organizationId: string): Promise<readonly { source: SearchSource; count: number; status: string }[]>;
}

/** Embedding request for semantic/vector search modes — AI Provider Hub contract reference. */
export interface SemanticSearchContext {
  readonly query: string;
  readonly modelId: string;
  readonly organizationId: string;
}
