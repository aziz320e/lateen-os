/** @module fallback/types */
import type { ModelId, ProviderId, FallbackChainId } from '../shared/identifiers.js';

export type FallbackTrigger =
  | 'provider-unavailable'
  | 'rate-limited'
  | 'timeout'
  | 'quota-exceeded'
  | 'error';

export interface FallbackStep {
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly priority: number;
}

export interface FallbackChain {
  readonly id: FallbackChainId;
  readonly steps: readonly FallbackStep[];
  readonly maxRetries: number;
  readonly retryDelayMs: number;
}

export interface FallbackAttempt {
  readonly step: FallbackStep;
  readonly trigger: FallbackTrigger;
  readonly attempt: number;
  readonly error?: string;
  readonly succeeded: boolean;
}

export interface FallbackResult {
  readonly chainId: FallbackChainId;
  readonly attempts: readonly FallbackAttempt[];
  readonly finalProviderId?: ProviderId;
  readonly finalModelId?: ModelId;
  readonly exhausted: boolean;
}

export interface FallbackPolicy {
  readonly triggers: readonly FallbackTrigger[];
  readonly chain: FallbackChain;
  readonly retryOnTimeout: boolean;
  readonly retryOnRateLimit: boolean;
}
