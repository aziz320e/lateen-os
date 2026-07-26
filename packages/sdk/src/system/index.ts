/**
 * The Lateen composition root — the official runtime entry point into
 * Lateen OS. See create-lateen.ts for `createLateen()`/`LateenSystem`/
 * `LateenClient`; each engine facade lives in its own module.
 *
 * @module system/index
 */
export { createLateen, type LateenConfig, type LateenSystem, type LateenClient } from './create-lateen.js';
export { createProviderHub, type ProviderHub, type ProviderHubConfig } from './provider-hub.js';
export { createDecisionEngineFacade, type DecisionEngine } from './decision-engine.js';
export { createIntelligenceEngineFacade, type IntelligenceEngine } from './intelligence-engine.js';
export { createRuntimeFacade, type Runtime, type RuntimeConfig } from './runtime.js';
export { createBrainFacade, type Brain, type BrainConfig } from './brain.js';
export { createCEO, type CEO, type CEOConfig } from './ceo.js';
export {
  ProviderNotConfiguredError,
  createUnconfiguredChatProvider,
  createUnconfiguredEmbeddingProvider,
  createUnconfiguredImageProvider,
  createUnconfiguredSpeechProvider,
  createUnconfiguredVisionProvider,
} from './stub-providers.js';
