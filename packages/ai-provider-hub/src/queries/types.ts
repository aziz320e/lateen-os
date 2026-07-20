/** @module queries/types */
import type { ModelId, ProviderId } from '../shared/identifiers.js';
import type { ProviderCapability } from '../provider/types.js';
import type { CostBreakdown } from '../cost/types.js';
import type { ProviderHealthSnapshot } from '../provider/types.js';
import type { ModelMetadata } from '../model/types.js';
import type { RoutingDecision } from '../routing/types.js';

export interface ListProvidersQuery {
  readonly capability?: ProviderCapability;
  readonly includeDisabled?: boolean;
}

export interface ListProvidersResult {
  readonly providers: readonly { readonly id: ProviderId; readonly kind: string; readonly displayName: string }[];
}

export interface ListModelsQuery {
  readonly providerId?: ProviderId;
  readonly capability?: ProviderCapability;
}

export interface ListModelsResult {
  readonly models: readonly ModelMetadata[];
}

export interface EstimateCostQuery {
  readonly modelId: ModelId;
  readonly promptTokens: number;
  readonly completionTokens: number;
}

export interface EstimateCostResult {
  readonly breakdown: CostBreakdown;
}

export interface SelectProviderQuery {
  readonly capability: ProviderCapability;
  readonly strategy: string;
}

export interface SelectProviderResult {
  readonly decision: RoutingDecision;
}

export interface ProviderHealthQuery {
  readonly providerId?: ProviderId;
}

export interface ProviderHealthResult {
  readonly health: readonly ProviderHealthSnapshot[];
}
