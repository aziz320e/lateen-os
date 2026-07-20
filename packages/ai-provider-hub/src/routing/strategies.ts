/** @module routing/strategies */
import { MODEL_CATALOG } from '../model/catalog.js';
import type { ModelMetadata } from '../model/types.js';
import type { RoutingContext, RoutingDecision, RoutingPolicy, RoutingRequest } from './types.js';
import { randomUUID } from 'node:crypto';

function filterModels(request: RoutingRequest): ModelMetadata[] {
  let models = MODEL_CATALOG.filter((m) => m.capabilities.includes(request.capability));
  if (request.policy.allowedProviderIds?.length) {
    models = models.filter((m) => request.policy.allowedProviderIds!.includes(m.providerId));
  }
  if (request.policy.allowedModelIds?.length) {
    models = models.filter((m) => request.policy.allowedModelIds!.includes(m.id));
  }
  return models;
}

function toDecision(request: RoutingRequest, model: ModelMetadata, reason: string): RoutingDecision {
  return {
    id: randomUUID(),
    strategy: request.policy.strategy,
    providerId: model.providerId,
    modelId: model.id,
    reason,
    estimatedCostPer1kTokens: String(
      (parseFloat(model.pricing.promptTokenUsd) + parseFloat(model.pricing.completionTokenUsd)) * 1000,
    ),
  };
}

/** Pure routing strategy helpers (contracts — no SDK calls). */
export function selectCheapest(request: RoutingRequest): RoutingDecision | undefined {
  const models = filterModels(request);
  if (!models.length) return undefined;
  const sorted = [...models].sort(
    (a, b) =>
      parseFloat(a.pricing.promptTokenUsd) +
      parseFloat(a.pricing.completionTokenUsd) -
      (parseFloat(b.pricing.promptTokenUsd) + parseFloat(b.pricing.completionTokenUsd)),
  );
  return toDecision(request, sorted[0]!, 'Selected cheapest model by token pricing');
}

export function selectFastest(request: RoutingRequest, context: RoutingContext): RoutingDecision | undefined {
  const models = filterModels(request);
  if (!models.length) return undefined;
  const sorted = [...models].sort(
    (a, b) => (context.providerLatencies[a.providerId] ?? Infinity) - (context.providerLatencies[b.providerId] ?? Infinity),
  );
  return toDecision(request, sorted[0]!, 'Selected fastest provider by measured latency');
}

export function selectHighestQuality(request: RoutingRequest): RoutingDecision | undefined {
  const models = filterModels(request);
  if (!models.length) return undefined;
  const qualityRank = { highest: 4, high: 3, balanced: 2, fast: 1 } as const;
  const sorted = [...models].sort((a, b) => qualityRank[b.quality] - qualityRank[a.quality]);
  return toDecision(request, sorted[0]!, 'Selected highest quality tier model');
}

export function selectManual(request: RoutingRequest): RoutingDecision | undefined {
  const { manualModelId, manualProviderId } = request.policy;
  if (!manualModelId && !manualProviderId) return undefined;
  const model = MODEL_CATALOG.find(
    (m) => m.id === manualModelId || (manualProviderId && m.providerId === manualProviderId),
  );
  if (!model) return undefined;
  return toDecision(request, model, 'Manual provider/model selection');
}

export function selectWeighted(request: RoutingRequest): RoutingDecision | undefined {
  const weights = request.policy.weightedProviders;
  if (!weights?.length) return undefined;
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * total;
  for (const entry of weights) {
    roll -= entry.weight;
    if (roll <= 0) {
      const model = MODEL_CATALOG.find(
        (m) => m.providerId === entry.providerId && m.capabilities.includes(request.capability),
      );
      if (model) return toDecision(request, model, `Weighted selection (weight=${entry.weight})`);
    }
  }
  return undefined;
}

export function applyRoutingStrategy(
  request: RoutingRequest,
  context: RoutingContext,
): RoutingDecision | undefined {
  switch (request.policy.strategy) {
    case 'cheapest':
      return selectCheapest(request);
    case 'fastest':
      return selectFastest(request, context);
    case 'highest-quality':
      return selectHighestQuality(request);
    case 'manual':
      return selectManual(request);
    case 'weighted':
      return selectWeighted(request);
    case 'policy-based':
      return selectHighestQuality(request) ?? selectCheapest(request);
    default:
      return selectCheapest(request);
  }
}
