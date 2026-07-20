/** @module model/types */
import type { ModelId, ProviderId } from '../shared/identifiers.js';
import type { ProviderCapability, ProviderKind } from '../provider/types.js';

export type ModelTier = 'frontier' | 'standard' | 'economy' | 'local';
export type ModelQuality = 'highest' | 'high' | 'balanced' | 'fast';

export interface ModelPricing {
  readonly promptTokenUsd: string;
  readonly completionTokenUsd: string;
  readonly cachedTokenUsd?: string;
  readonly imageUnitUsd?: string;
  readonly audioMinuteUsd?: string;
}

export interface ModelMetadata {
  readonly id: ModelId;
  readonly providerId: ProviderId;
  readonly providerKind: ProviderKind;
  readonly displayName: string;
  readonly modelCode: string;
  readonly contextWindow: number;
  readonly maxOutputTokens: number;
  readonly capabilities: readonly ProviderCapability[];
  readonly tier: ModelTier;
  readonly quality: ModelQuality;
  readonly supportsReasoning: boolean;
  readonly pricing: ModelPricing;
}

export interface ModelRegistration {
  readonly metadata: ModelMetadata;
  readonly enabled: boolean;
}

export interface ModelSelectionCriteria {
  readonly capability: ProviderCapability;
  readonly minContextWindow?: number;
  readonly maxCostPer1kTokens?: string;
  readonly preferredProviderKinds?: readonly ProviderKind[];
  readonly requiresReasoning?: boolean;
}
