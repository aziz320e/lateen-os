/** @module routing/types */
import type { ModelId, ProviderId, RoutingDecisionId } from '../shared/identifiers.js';
import type { ProviderCapability } from '../provider/types.js';

export type RoutingStrategy =
  | 'cheapest'
  | 'fastest'
  | 'highest-quality'
  | 'policy-based'
  | 'manual'
  | 'weighted';

export interface WeightedProviderEntry {
  readonly providerId: ProviderId;
  readonly weight: number;
}

export interface RoutingPolicy {
  readonly strategy: RoutingStrategy;
  readonly allowedProviderIds?: readonly ProviderId[];
  readonly allowedModelIds?: readonly ModelId[];
  readonly weightedProviders?: readonly WeightedProviderEntry[];
  readonly manualProviderId?: ProviderId;
  readonly manualModelId?: ModelId;
}

export interface RoutingRequest {
  readonly capability: ProviderCapability;
  readonly policy: RoutingPolicy;
  readonly organizationId?: string;
  readonly correlationId?: string;
}

export interface RoutingDecision {
  readonly id: RoutingDecisionId;
  readonly strategy: RoutingStrategy;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly reason: string;
  readonly estimatedCostPer1kTokens?: string;
  readonly estimatedLatencyMs?: number;
}

export interface RoutingContext {
  readonly providerLatencies: Readonly<Record<string, number>>;
  readonly providerCosts: Readonly<Record<string, string>>;
  readonly providerHealth: Readonly<Record<string, 'healthy' | 'degraded' | 'unavailable'>>;
}
