/**
 * Central AI Provider Hub port.
 *
 * Applications MUST NOT call LLM providers directly.
 * AI Brain MUST consume this hub for all model interactions.
 *
 * @module hub
 */

import type { ProviderRegistry } from './provider/registry.js';
import type { ProviderHealth } from './provider/health.js';
import type { ModelRegistry } from './model/registry.js';
import type { ProviderSelector } from './routing/selector.js';
import type { CostCalculator } from './cost/calculator.js';
import type { EmbeddingProvider } from './embedding/provider.js';
import type { VisionProvider } from './vision/provider.js';
import type { SpeechProvider } from './speech/provider.js';
import type { ImageProvider } from './image/provider.js';
import type { ProviderTelemetry } from './telemetry/types.js';
import type { ProviderCache } from './cache/types.js';
import type { PolicyEnforcer } from './policy/types.js';
import type { ProviderQueries } from './queries/provider-queries.js';
import type { StreamingChatProvider } from './streaming/types.js';

/** Composition of all Provider Hub capability ports. */
export interface ProviderHubCapabilities {
  readonly registry: ProviderRegistry;
  readonly modelRegistry: ModelRegistry;
  readonly selector: ProviderSelector;
  readonly health: ProviderHealth;
  readonly costCalculator: CostCalculator;
  readonly chat: StreamingChatProvider;
  readonly embedding: EmbeddingProvider;
  readonly vision: VisionProvider;
  readonly speech: SpeechProvider;
  readonly image: ImageProvider;
  readonly telemetry: ProviderTelemetry;
  readonly cache: ProviderCache;
  readonly policy: PolicyEnforcer;
  readonly queries: ProviderQueries;
}

/** Central provider hub port — unified LLM abstraction. */
export interface AiProviderHub {
  readonly capabilities: ProviderHubCapabilities;
  readonly version: string;
}
