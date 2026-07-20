/** @module vision/types */
import { z } from 'zod';
import type { ModelId, ProviderId, VisionRequestId } from '../shared/identifiers.js';

export const visionContentSchema = z.object({
  type: z.enum(['text', 'image_url', 'image_base64']),
  text: z.string().optional(),
  url: z.string().url().optional(),
  base64: z.string().optional(),
  mimeType: z.string().optional(),
});

export const visionRequestSchema = z.object({
  modelId: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.union([z.string(), z.array(visionContentSchema)]),
    }),
  ),
  maxTokens: z.number().int().positive().optional(),
});

export type VisionRequest = z.infer<typeof visionRequestSchema> & {
  readonly id?: VisionRequestId;
  readonly providerId?: ProviderId;
  readonly modelId: ModelId;
};

export interface VisionResult {
  readonly requestId: VisionRequestId;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly content: string;
  readonly tokenCount: number;
  readonly latencyMs: number;
}
