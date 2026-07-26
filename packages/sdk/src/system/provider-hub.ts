/**
 * ProviderHub facade — a thin, curated wrapper over
 * `@lateen-os/ai-provider-hub`'s already-clean `createAiProviderHub`
 * composition root. Unconfigured chat/embedding/vision/speech/image
 * capabilities degrade to "not configured" stubs (see stub-providers.ts)
 * so `createProviderHub()` is always constructible without a live provider.
 *
 * @module system/provider-hub
 */
import { createAiProviderHub } from '@lateen-os/ai-provider-hub';
import type {
  AiProviderHub,
  CostCalculator,
  EmbeddingProvider,
  ImageProvider,
  ModelRegistration,
  ProviderRegistration,
  SpeechProvider,
  StreamingChatProvider,
  VisionProvider,
} from '@lateen-os/ai-provider-hub';
import {
  createUnconfiguredChatProvider,
  createUnconfiguredEmbeddingProvider,
  createUnconfiguredImageProvider,
  createUnconfiguredSpeechProvider,
  createUnconfiguredVisionProvider,
} from './stub-providers.js';

export interface ProviderHubConfig {
  readonly chat?: StreamingChatProvider;
  readonly embedding?: EmbeddingProvider;
  readonly vision?: VisionProvider;
  readonly speech?: SpeechProvider;
  readonly image?: ImageProvider;
  readonly costCalculator?: CostCalculator;
  readonly providerSeed?: readonly ProviderRegistration[];
  readonly modelSeed?: readonly ModelRegistration[];
  readonly version?: string;
}

/** Public provider hub facade — re-exported as-is; already hides no internals beyond its own capabilities. */
export type ProviderHub = AiProviderHub;

/** Creates a {@link ProviderHub}, degrading any unconfigured capability to a "not configured" stub. */
export function createProviderHub(config: ProviderHubConfig = {}): ProviderHub {
  return createAiProviderHub({
    chat: config.chat ?? createUnconfiguredChatProvider(),
    embedding: config.embedding ?? createUnconfiguredEmbeddingProvider(),
    vision: config.vision ?? createUnconfiguredVisionProvider(),
    speech: config.speech ?? createUnconfiguredSpeechProvider(),
    image: config.image ?? createUnconfiguredImageProvider(),
    costCalculator: config.costCalculator,
    providerSeed: config.providerSeed,
    modelSeed: config.modelSeed,
    version: config.version,
  });
}
