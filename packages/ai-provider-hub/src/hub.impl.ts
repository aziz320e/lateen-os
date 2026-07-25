/**
 * Composition root for {@link AiProviderHub}. Wires the real registries,
 * cache, telemetry, policy enforcer, health checker, and query layer
 * together. `chat`, `embedding`, `vision`, `speech`, and `image` providers
 * are supplied by the caller — `chat`/`embedding` get real
 * OpenAI-compatible implementations from `streaming/` and `embedding/`
 * (see the caller-facing convenience in those modules); `vision`/`speech`/
 * `image` remain bring-your-own (out of scope for this pass — see
 * ARCHITECTURE.md).
 *
 * @module hub.impl
 */
import type { AiProviderHub, ProviderHubCapabilities } from './hub.js';
import type { StreamingChatProvider } from './streaming/types.js';
import type { EmbeddingProvider } from './embedding/provider.js';
import type { VisionProvider } from './vision/provider.js';
import type { SpeechProvider } from './speech/provider.js';
import type { ImageProvider } from './image/provider.js';
import type { CostCalculator } from './cost/calculator.js';
import type { ProviderRegistration } from './provider/types.js';
import type { ModelRegistration } from './model/types.js';

import { createProviderRegistry } from './provider/registry.impl.js';
import { createModelRegistry } from './model/registry.impl.js';
import { createProviderSelector } from './routing/selector.impl.js';
import { createProviderHealth, type ProviderHealthCheckFn } from './provider/health.impl.js';
import { defaultCostCalculator } from './cost/calculator.js';
import { createInMemoryProviderCache } from './cache/cache.impl.js';
import { createProviderTelemetry } from './telemetry/telemetry.impl.js';
import { createPolicyEnforcer } from './policy/policy.impl.js';
import { createProviderQueries } from './queries/provider-queries.impl.js';

export interface CreateAiProviderHubConfig {
  readonly chat: StreamingChatProvider;
  readonly embedding: EmbeddingProvider;
  readonly vision: VisionProvider;
  readonly speech: SpeechProvider;
  readonly image: ImageProvider;
  readonly costCalculator?: CostCalculator;
  readonly healthCheckTimeoutMs?: number;
  readonly healthCheck?: ProviderHealthCheckFn;
  readonly providerSeed?: readonly ProviderRegistration[];
  readonly modelSeed?: readonly ModelRegistration[];
  readonly version?: string;
}

/** Builds a fully-wired {@link AiProviderHub} from real component implementations. */
export function createAiProviderHub(config: CreateAiProviderHubConfig): AiProviderHub {
  const registry = createProviderRegistry({ seed: config.providerSeed });
  const modelRegistry = createModelRegistry({ seed: config.modelSeed });
  const selector = createProviderSelector();
  const health = createProviderHealth(registry, {
    checkTimeoutMs: config.healthCheckTimeoutMs,
    check: config.healthCheck,
  });
  const costCalculator = config.costCalculator ?? defaultCostCalculator;
  const cache = createInMemoryProviderCache();
  const telemetry = createProviderTelemetry(registry);
  const policy = createPolicyEnforcer();
  const queries = createProviderQueries({
    providerRegistry: registry,
    modelRegistry,
    costCalculator,
    selector,
    health,
  });

  const capabilities: ProviderHubCapabilities = {
    registry,
    modelRegistry,
    selector,
    health,
    costCalculator,
    chat: config.chat,
    embedding: config.embedding,
    vision: config.vision,
    speech: config.speech,
    image: config.image,
    telemetry,
    cache,
    policy,
    queries,
  };

  return {
    capabilities,
    version: config.version ?? '1.0.0',
  };
}
