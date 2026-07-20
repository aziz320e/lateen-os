/** AI Provider Hub embedding request shape (contract reference — no SDK). */
import { embeddingRequestSchema } from '@lateen-os/ai-provider-hub';

export { embeddingRequestSchema };

export interface HubEmbeddingRequest {
  readonly input: string | readonly string[];
  readonly modelId: string;
  readonly dimensions?: number;
  readonly correlationId?: string;
}

export interface HubEmbeddingResult {
  readonly requestId: string;
  readonly modelId: string;
  readonly embeddings: readonly (readonly number[])[];
  readonly tokenCount: number;
  readonly latencyMs: number;
}

export interface EmbeddingRequestPayload {
  readonly organizationId: string;
  readonly knowledgeId: string;
  readonly chunks: readonly { readonly id: string; readonly text: string }[];
  readonly modelId: string;
  readonly correlationId: string;
}

export interface EmbeddingRequestResult {
  readonly requestId: string;
  readonly modelId: string;
  readonly chunkEmbeddings: readonly {
    readonly chunkId: string;
    readonly dimensions: number;
    readonly tokenCount: number;
  }[];
  readonly totalTokens: number;
}

/** AI Provider Hub embedding request port — contract only, no LLM SDK. */
export interface EmbeddingRequestPort {
  requestEmbeddings(payload: EmbeddingRequestPayload): Promise<EmbeddingRequestResult>;
  toHubRequest(payload: EmbeddingRequestPayload): HubEmbeddingRequest;
}

export interface VectorIndexRequest {
  readonly organizationId: string;
  readonly knowledgeId: string;
  readonly collection: string;
  readonly vectors: readonly {
    readonly id: string;
    readonly chunkId: string;
    readonly dimensions: number;
  }[];
}

export interface VectorIndexResult {
  readonly indexed: number;
  readonly collection: string;
  readonly qdrantUrl: string;
}

/** Qdrant vector index request port — contract only, no vector DB implementation. */
export interface VectorIndexPort {
  index(request: VectorIndexRequest): Promise<VectorIndexResult>;
  deleteByKnowledgeId(organizationId: string, knowledgeId: string): Promise<void>;
}
