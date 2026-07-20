/** @module image/types */
import { z } from 'zod';
import type { ImageRequestId, ModelId, ProviderId } from '../shared/identifiers.js';

export const imageGenerationRequestSchema = z.object({
  modelId: z.string(),
  prompt: z.string(),
  size: z.enum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792']).default('1024x1024'),
  quality: z.enum(['standard', 'hd']).default('standard'),
  count: z.number().int().min(1).max(4).default(1),
});

export type ImageGenerationRequest = z.infer<typeof imageGenerationRequestSchema> & {
  readonly id?: ImageRequestId;
  readonly providerId?: ProviderId;
  readonly modelId: ModelId;
};

export interface ImageGenerationResult {
  readonly requestId: ImageRequestId;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly images: readonly { readonly url?: string; readonly base64?: string; readonly mimeType: string }[];
  readonly latencyMs: number;
}
