/** @module streaming/types */
import { z } from 'zod';
import type { ModelId, ProviderId, ProviderRequestId } from '../shared/identifiers.js';

export const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  name: z.string().optional(),
  toolCallId: z.string().optional(),
});

export const chatCompletionRequestSchema = z.object({
  modelId: z.string(),
  messages: z.array(chatMessageSchema),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  stream: z.boolean().default(false),
  jsonMode: z.boolean().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatCompletionRequest = z.infer<typeof chatCompletionRequestSchema> & {
  readonly id?: ProviderRequestId;
  readonly providerId?: ProviderId;
  readonly modelId: ModelId;
};

export type StreamEventType = 'token' | 'tool-call' | 'reasoning' | 'done' | 'error';

export interface StreamEvent {
  readonly type: StreamEventType;
  readonly delta?: string;
  readonly toolCall?: { readonly id: string; readonly name: string; readonly arguments: string };
  readonly reasoning?: string;
  readonly finishReason?: 'stop' | 'length' | 'tool_calls' | 'error';
  readonly error?: string;
}

export interface ChatCompletionResult {
  readonly requestId: ProviderRequestId;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly content: string;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly cachedTokens?: number;
  readonly latencyMs: number;
  readonly finishReason: string;
}

export interface StreamingChatProvider {
  complete(request: ChatCompletionRequest): Promise<ChatCompletionResult>;
  stream(request: ChatCompletionRequest): AsyncIterable<StreamEvent>;
}
