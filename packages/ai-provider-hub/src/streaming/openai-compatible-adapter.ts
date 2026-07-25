/**
 * Real, dependency-free {@link StreamingChatProvider} implementation using
 * native `fetch` against any OpenAI-compatible `/chat/completions` endpoint
 * (OpenAI, Azure OpenAI, Ollama, OpenRouter, and most cataloged providers
 * implement this exact shape). Real non-streaming completions and real
 * Server-Sent-Events stream parsing — no vendor SDK dependency.
 *
 * @module streaming/openai-compatible-adapter
 */
import { randomUUID } from 'node:crypto';
import { withRetry, withSpan } from '@lateen-os/shared-kernel/observability';
import type { ProviderId } from '../shared/identifiers.js';
import type { ChatCompletionRequest, ChatCompletionResult, ChatMessage, StreamEvent, StreamingChatProvider } from './types.js';

export interface OpenAiCompatibleChatConfig {
  readonly providerId: ProviderId;
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly headers?: Record<string, string>;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  /** Injectable for tests — defaults to the global `fetch`. */
  readonly fetchImpl?: typeof fetch;
}

interface OpenAiChatCompletionResponse {
  readonly choices: readonly {
    readonly message?: { readonly content?: string };
    readonly finish_reason?: string;
  }[];
  readonly usage?: {
    readonly prompt_tokens?: number;
    readonly completion_tokens?: number;
    readonly prompt_tokens_details?: { readonly cached_tokens?: number };
  };
}

interface OpenAiChatCompletionChunk {
  readonly choices?: readonly {
    readonly delta?: { readonly content?: string };
    readonly finish_reason?: string | null;
  }[];
}

function toOpenAiMessages(messages: readonly ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
    ...(message.name ? { name: message.name } : {}),
    ...(message.toolCallId ? { tool_call_id: message.toolCallId } : {}),
  }));
}

function mapFinishReason(reason: string | null | undefined): 'stop' | 'length' | 'tool_calls' | 'error' {
  if (reason === 'length') return 'length';
  if (reason === 'tool_calls') return 'tool_calls';
  if (reason === 'stop') return 'stop';
  return 'error';
}

/** Retries network errors and 429/5xx responses; anything else (4xx auth/validation errors) fails fast. */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const match = /^HTTP (\d+)/.exec(error.message);
  if (!match) return true;
  const status = parseInt(match[1]!, 10);
  return status === 429 || status >= 500;
}

/** Creates a real {@link StreamingChatProvider} against any OpenAI-compatible endpoint. */
export function createOpenAiCompatibleChatProvider(config: OpenAiCompatibleChatConfig): StreamingChatProvider {
  const fetchImpl = config.fetchImpl ?? fetch;
  const timeoutMs = config.timeoutMs ?? 60_000;

  function requestHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      ...config.headers,
    };
  }

  async function complete(request: ChatCompletionRequest): Promise<ChatCompletionResult> {
    return withSpan(
      'lateen.ai-provider-hub',
      'chat.complete',
      () =>
        withRetry(
          async () => {
            const started = Date.now();
            const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
              method: 'POST',
              headers: requestHeaders(),
              body: JSON.stringify({
                model: request.modelId,
                messages: toOpenAiMessages(request.messages),
                temperature: request.temperature,
                max_tokens: request.maxTokens,
                ...(request.jsonMode ? { response_format: { type: 'json_object' } } : {}),
                stream: false,
              }),
              signal: AbortSignal.timeout(timeoutMs),
            });

            if (!response.ok) {
              const text = await response.text().catch(() => '');
              throw new Error(`HTTP ${response.status} calling chat completions: ${text}`);
            }

            const body = (await response.json()) as OpenAiChatCompletionResponse;
            const choice = body.choices[0];

            return {
              requestId: request.id ?? randomUUID(),
              providerId: request.providerId ?? config.providerId,
              modelId: request.modelId,
              content: choice?.message?.content ?? '',
              promptTokens: body.usage?.prompt_tokens ?? 0,
              completionTokens: body.usage?.completion_tokens ?? 0,
              cachedTokens: body.usage?.prompt_tokens_details?.cached_tokens,
              latencyMs: Date.now() - started,
              finishReason: choice?.finish_reason ?? 'stop',
            };
          },
          { maxAttempts: config.maxRetries ?? 3, shouldRetry: isRetryableError },
        ),
      { 'lateen.provider.id': config.providerId, 'lateen.model.id': request.modelId },
    );
  }

  async function* stream(request: ChatCompletionRequest): AsyncIterable<StreamEvent> {
    const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: requestHeaders(),
      body: JSON.stringify({
        model: request.modelId,
        messages: toOpenAiMessages(request.messages),
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream: true,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => '');
      yield { type: 'error', error: `HTTP ${response.status} calling chat completions: ${text}` };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice('data:'.length).trim();
          if (data === '[DONE]') {
            yield { type: 'done', finishReason: 'stop' };
            return;
          }
          let chunk: OpenAiChatCompletionChunk;
          try {
            chunk = JSON.parse(data) as OpenAiChatCompletionChunk;
          } catch {
            continue; // Ignore malformed/keep-alive SSE lines.
          }
          const delta = chunk.choices?.[0]?.delta?.content;
          const finishReason = chunk.choices?.[0]?.finish_reason;
          if (delta) {
            yield { type: 'token', delta };
          }
          if (finishReason) {
            yield { type: 'done', finishReason: mapFinishReason(finishReason) };
            return;
          }
        }
      }
      yield { type: 'done', finishReason: 'stop' };
    } catch (error) {
      yield { type: 'error', error: error instanceof Error ? error.message : String(error) };
    } finally {
      reader.releaseLock();
    }
  }

  return { complete, stream };
}
