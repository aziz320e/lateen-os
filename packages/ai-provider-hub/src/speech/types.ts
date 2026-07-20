/** @module speech/types */
import { z } from 'zod';
import type { ModelId, ProviderId, SpeechRequestId } from '../shared/identifiers.js';

export const speechToTextRequestSchema = z.object({
  modelId: z.string(),
  audioBase64: z.string(),
  mimeType: z.string(),
  language: z.string().optional(),
});

export const textToSpeechRequestSchema = z.object({
  modelId: z.string(),
  text: z.string(),
  voice: z.string().optional(),
  format: z.enum(['mp3', 'wav', 'opus', 'pcm']).default('mp3'),
});

export type SpeechToTextRequest = z.infer<typeof speechToTextRequestSchema> & {
  readonly id?: SpeechRequestId;
  readonly providerId?: ProviderId;
  readonly modelId: ModelId;
};

export type TextToSpeechRequest = z.infer<typeof textToSpeechRequestSchema> & {
  readonly id?: SpeechRequestId;
  readonly providerId?: ProviderId;
  readonly modelId: ModelId;
};

export interface SpeechToTextResult {
  readonly requestId: SpeechRequestId;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly transcript: string;
  readonly durationMs: number;
  readonly latencyMs: number;
}

export interface TextToSpeechResult {
  readonly requestId: SpeechRequestId;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly audioBase64: string;
  readonly mimeType: string;
  readonly latencyMs: number;
}
