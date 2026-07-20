/** @module embedding/provider */
import type { EmbeddingRequest, EmbeddingResult } from './types.js';

/** Embedding capability port. */
export interface EmbeddingProvider {
  embed(request: EmbeddingRequest): Promise<EmbeddingResult>;
  embedBatch(requests: readonly EmbeddingRequest[]): Promise<readonly EmbeddingResult[]>;
  getDimensions(modelId: string): Promise<number>;
}
