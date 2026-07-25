/**
 * Real in-memory {@link ProviderTelemetry} implementation — aggregates usage
 * per provider and per model from recorded {@link RequestTelemetry} events.
 *
 * @module telemetry/telemetry.impl
 */
import type { ModelId, ProviderId } from '../shared/identifiers.js';
import type {
  ModelUsageMetrics,
  ProviderTelemetry,
  ProviderUsageMetrics,
  RequestTelemetry,
  TelemetrySpanAttributes,
} from './types.js';
import type { ProviderRegistry } from '../provider/registry.js';

interface MutableProviderUsage {
  requestCount: number;
  errorCount: number;
  totalTokens: number;
  totalCostUsd: number;
  totalLatencyMs: number;
}

interface MutableModelUsage {
  providerId: ProviderId;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  totalTokens: number;
  totalLatencyMs: number;
}

/**
 * Creates an in-memory {@link ProviderTelemetry} recorder. An optional
 * {@link ProviderRegistry} lets `toSpanAttributes` resolve the real provider
 * kind — `RequestTelemetry` itself only carries the provider id.
 */
export function createProviderTelemetry(providerRegistry?: ProviderRegistry): ProviderTelemetry {
  const providerUsage = new Map<ProviderId, MutableProviderUsage>();
  const modelUsage = new Map<ModelId, MutableModelUsage>();

  return {
    async record(telemetry: RequestTelemetry) {
      const provider = providerUsage.get(telemetry.providerId) ?? {
        requestCount: 0,
        errorCount: 0,
        totalTokens: 0,
        totalCostUsd: 0,
        totalLatencyMs: 0,
      };
      provider.requestCount += 1;
      if (telemetry.error) provider.errorCount += 1;
      provider.totalTokens += telemetry.tokenUsage?.totalTokens ?? 0;
      provider.totalCostUsd += telemetry.costUsd ? parseFloat(telemetry.costUsd) : 0;
      provider.totalLatencyMs += telemetry.latencyMs;
      providerUsage.set(telemetry.providerId, provider);

      const model = modelUsage.get(telemetry.modelId) ?? {
        providerId: telemetry.providerId,
        requestCount: 0,
        promptTokens: 0,
        completionTokens: 0,
        cachedTokens: 0,
        totalTokens: 0,
        totalLatencyMs: 0,
      };
      model.requestCount += 1;
      model.promptTokens += telemetry.tokenUsage?.promptTokens ?? 0;
      model.completionTokens += telemetry.tokenUsage?.completionTokens ?? 0;
      model.cachedTokens += telemetry.tokenUsage?.cachedTokens ?? 0;
      model.totalTokens += telemetry.tokenUsage?.totalTokens ?? 0;
      model.totalLatencyMs += telemetry.latencyMs;
      modelUsage.set(telemetry.modelId, model);
    },

    async getProviderUsage(providerId): Promise<ProviderUsageMetrics> {
      const usage = providerUsage.get(providerId);
      return {
        providerId,
        requestCount: usage?.requestCount ?? 0,
        errorCount: usage?.errorCount ?? 0,
        totalTokens: usage?.totalTokens ?? 0,
        totalCostUsd: (usage?.totalCostUsd ?? 0).toFixed(8),
        averageLatencyMs: usage && usage.requestCount > 0 ? usage.totalLatencyMs / usage.requestCount : 0,
      };
    },

    async getModelUsage(modelId): Promise<ModelUsageMetrics> {
      const usage = modelUsage.get(modelId);
      return {
        modelId,
        providerId: usage?.providerId ?? '',
        requestCount: usage?.requestCount ?? 0,
        tokenUsage: {
          promptTokens: usage?.promptTokens ?? 0,
          completionTokens: usage?.completionTokens ?? 0,
          cachedTokens: usage?.cachedTokens ?? 0,
          totalTokens: usage?.totalTokens ?? 0,
        },
        averageLatencyMs: usage && usage.requestCount > 0 ? usage.totalLatencyMs / usage.requestCount : 0,
      };
    },

    toSpanAttributes(telemetry): TelemetrySpanAttributes {
      const kind = providerRegistry?.getMetadata(telemetry.providerId)?.kind ?? telemetry.providerId;
      return {
        'lateen.provider.id': telemetry.providerId,
        'lateen.provider.kind': kind,
        'lateen.model.id': telemetry.modelId,
        ...(telemetry.tokenUsage?.promptTokens !== undefined
          ? { 'lateen.tokens.prompt': telemetry.tokenUsage.promptTokens }
          : {}),
        ...(telemetry.tokenUsage?.completionTokens !== undefined
          ? { 'lateen.tokens.completion': telemetry.tokenUsage.completionTokens }
          : {}),
        ...(telemetry.costUsd !== undefined ? { 'lateen.cost.usd': telemetry.costUsd } : {}),
        'lateen.latency.ms': telemetry.latencyMs,
      };
    },
  };
}
