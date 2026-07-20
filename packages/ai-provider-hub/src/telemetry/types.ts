/** @module telemetry/types */
import type { ModelId, ProviderId } from '../shared/identifiers.js';
import type { CorrelationId, LatencyMs, TokenCount } from '../shared/primitives.js';

export interface TokenUsage {
  readonly promptTokens: TokenCount;
  readonly completionTokens: TokenCount;
  readonly cachedTokens?: TokenCount;
  readonly totalTokens: TokenCount;
}

export interface ProviderUsageMetrics {
  readonly providerId: ProviderId;
  readonly requestCount: number;
  readonly errorCount: number;
  readonly totalTokens: TokenCount;
  readonly totalCostUsd: string;
  readonly averageLatencyMs: LatencyMs;
}

export interface ModelUsageMetrics {
  readonly modelId: ModelId;
  readonly providerId: ProviderId;
  readonly requestCount: number;
  readonly tokenUsage: TokenUsage;
  readonly averageLatencyMs: LatencyMs;
}

export interface RequestTelemetry {
  readonly correlationId: CorrelationId;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly capability: string;
  readonly latencyMs: LatencyMs;
  readonly tokenUsage?: TokenUsage;
  readonly costUsd?: string;
  readonly error?: string;
  readonly timestamp: string;
}

/** OpenTelemetry-compatible span attributes for provider requests. */
export interface TelemetrySpanAttributes {
  readonly 'lateen.provider.id': string;
  readonly 'lateen.provider.kind': string;
  readonly 'lateen.model.id': string;
  readonly 'lateen.tokens.prompt'?: number;
  readonly 'lateen.tokens.completion'?: number;
  readonly 'lateen.cost.usd'?: string;
  readonly 'lateen.latency.ms'?: number;
}

export interface ProviderTelemetry {
  record(request: RequestTelemetry): Promise<void>;
  getProviderUsage(providerId: ProviderId): Promise<ProviderUsageMetrics>;
  getModelUsage(modelId: ModelId): Promise<ModelUsageMetrics>;
  toSpanAttributes(telemetry: RequestTelemetry): TelemetrySpanAttributes;
}
