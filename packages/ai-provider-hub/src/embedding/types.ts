/** @module embedding/types */
import { z } from 'zod';
import type { EmbeddingRequestId, ModelId, ProviderId } from '../shared/identifiers.js';
import type { CorrelationId } from '../shared/primitives.js';

export const embeddingRequestSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  modelId: z.string(),
  dimensions: z.number().int().positive().optional(),
  correlationId: z.string().optional(),
});

export type EmbeddingRequest = z.infer<typeof embeddingRequestSchema> & {
  readonly id?: EmbeddingRequestId;
  readonly providerId?: ProviderId;
  readonly modelId: ModelId;
  readonly correlationId?: CorrelationId;
};

export interface EmbeddingResult {
  readonly requestId: EmbeddingRequestId;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly embeddings: readonly (readonly number[])[];
  readonly tokenCount: number;
  readonly latencyMs: number;
}
