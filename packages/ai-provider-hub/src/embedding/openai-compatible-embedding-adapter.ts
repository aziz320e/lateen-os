/**
 * Real, dependency-free {@link EmbeddingProvider} implementation using
 * native `fetch` against any OpenAI-compatible `/embeddings` endpoint.
 *
 * @module embedding/openai-compatible-embedding-adapter
 */
import { randomUUID } from 'node:crypto';
import { withRetry, withSpan } from '@lateen-os/shared-kernel/observability';
import type { ProviderId } from '../shared/identifiers.js';
import type { EmbeddingProvider } from './provider.js';
import type { EmbeddingRequest, EmbeddingResult } from './types.js';

export interface OpenAiCompatibleEmbeddingConfig {
  readonly providerId: ProviderId;
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly headers?: Record<string, string>;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  /** Injectable for tests — defaults to the global `fetch`. */
  readonly fetchImpl?: typeof fetch;
}

interface OpenAiEmbeddingResponse {
  readonly data: readonly { readonly embedding: readonly number[] }[];
  readonly usage?: { readonly total_tokens?: number };
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const match = /^HTTP (\d+)/.exec(error.message);
  if (!match) return true;
  const status = parseInt(match[1]!, 10);
  return status === 429 || status >= 500;
}

/** Creates a real {@link EmbeddingProvider} against any OpenAI-compatible endpoint. */
export function createOpenAiCompatibleEmbeddingProvider(config: OpenAiCompatibleEmbeddingConfig): EmbeddingProvider {
  const fetchImpl = config.fetchImpl ?? fetch;
  const timeoutMs = config.timeoutMs ?? 30_000;

  function requestHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      ...config.headers,
    };
  }

  async function embedOne(request: EmbeddingRequest): Promise<EmbeddingResult> {
    return withSpan(
      'lateen.ai-provider-hub',
      'embedding.embed',
      () =>
        withRetry(
          async () => {
            const started = Date.now();
            const response = await fetchImpl(`${config.baseUrl}/embeddings`, {
              method: 'POST',
              headers: requestHeaders(),
              body: JSON.stringify({
                model: request.modelId,
                input: request.input,
                ...(request.dimensions ? { dimensions: request.dimensions } : {}),
              }),
              signal: AbortSignal.timeout(timeoutMs),
            });

            if (!response.ok) {
              const text = await response.text().catch(() => '');
              throw new Error(`HTTP ${response.status} calling embeddings: ${text}`);
            }

            const body = (await response.json()) as OpenAiEmbeddingResponse;
            return {
              requestId: request.id ?? randomUUID(),
              providerId: request.providerId ?? config.providerId,
              modelId: request.modelId,
              embeddings: body.data.map((entry) => entry.embedding),
              tokenCount: body.usage?.total_tokens ?? 0,
              latencyMs: Date.now() - started,
            };
          },
          { maxAttempts: config.maxRetries ?? 3, shouldRetry: isRetryableError },
        ),
      { 'lateen.provider.id': config.providerId, 'lateen.model.id': request.modelId },
    );
  }

  return {
    embed: embedOne,
    async embedBatch(requests) {
      return Promise.all(requests.map((request) => embedOne(request)));
    },
    async getDimensions(modelId) {
      const result = await embedOne({ input: 'dimension probe', modelId, providerId: config.providerId });
      return result.embeddings[0]?.length ?? 0;
    },
  };
}
