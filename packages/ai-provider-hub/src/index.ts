/**
 * @lateen-os/ai-provider-hub — AI Provider Hub
 *
 * Canonical LLM provider abstraction for Lateen OS. AI Brain MUST consume this hub.
 * Applications MUST NEVER call providers directly.
 *
 * Real in-memory registries, cache, telemetry, policy enforcement, health
 * checking, and query layer (see `createAiProviderHub`). `chat`/`embedding`
 * providers are real OpenAI-compatible HTTP adapters (see `streaming/` and
 * `embedding/`); `vision`/`speech`/`image` remain bring-your-own.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';

export * as provider from './provider/index.js';
export * as model from './model/index.js';
export * as routing from './routing/index.js';
export * as embedding from './embedding/index.js';
export * as vision from './vision/index.js';
export * as speech from './speech/index.js';
export * as image from './image/index.js';
export * as streaming from './streaming/index.js';
export * as toolCalling from './tool-calling/index.js';
export * as structuredOutput from './structured-output/index.js';
export * as fallback from './fallback/index.js';
export * as cache from './cache/index.js';
export * as telemetry from './telemetry/index.js';
export * as cost from './cost/index.js';
export * as policy from './policy/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export type { AiProviderHub, ProviderHubCapabilities } from './hub.js';
export type { CreateAiProviderHubConfig } from './hub.impl.js';
export { createAiProviderHub } from './hub.impl.js';

export type {
  ProviderKind,
  ProviderCapability,
  ProviderMetadata,
  ProviderRegistration,
  ProviderHealthSnapshot,
} from './provider/types.js';

export { PROVIDER_CATALOG, SUPPORTED_PROVIDER_KINDS } from './provider/catalog.js';
export type { ProviderRegistry } from './provider/registry.js';
export { createProviderRegistry } from './provider/registry.impl.js';
export type { ProviderHealth } from './provider/health.js';
export {
  createProviderHealth,
  type ProviderHealthCheckFn,
  type ProviderHealthCheckResult,
} from './provider/health.impl.js';

export type {
  ModelMetadata,
  ModelRegistration,
  ModelSelectionCriteria,
  ModelTier,
  ModelQuality,
} from './model/types.js';

export { MODEL_CATALOG, getModelsByProvider, getModelsByCapability } from './model/catalog.js';
export type { ModelRegistry } from './model/registry.js';
export { createModelRegistry } from './model/registry.impl.js';

export type {
  RoutingStrategy,
  RoutingPolicy,
  RoutingRequest,
  RoutingDecision,
  RoutingContext,
} from './routing/types.js';

export type { ProviderSelector } from './routing/selector.js';
export { createProviderSelector } from './routing/selector.impl.js';
export {
  selectCheapest,
  selectFastest,
  selectHighestQuality,
  selectManual,
  selectWeighted,
  applyRoutingStrategy,
} from './routing/strategies.js';

export type { EmbeddingProvider } from './embedding/provider.js';
export {
  createOpenAiCompatibleEmbeddingProvider,
  type OpenAiCompatibleEmbeddingConfig,
} from './embedding/openai-compatible-embedding-adapter.js';
export type { VisionProvider } from './vision/provider.js';
export type { SpeechProvider } from './speech/provider.js';
export type { ImageProvider } from './image/provider.js';

export type {
  ChatCompletionRequest,
  ChatCompletionResult,
  StreamEvent,
  StreamingChatProvider,
} from './streaming/types.js';
export {
  createOpenAiCompatibleChatProvider,
  type OpenAiCompatibleChatConfig,
} from './streaming/openai-compatible-adapter.js';

export type { ToolDefinition, ToolCall, ToolResult } from './tool-calling/types.js';
export type { StructuredOutputResult, StructuredOutputProvider } from './structured-output/types.js';
export { createStructuredOutputProvider } from './structured-output/structured-output.impl.js';

export type {
  FallbackTrigger,
  FallbackChain,
  FallbackPolicy,
  FallbackResult,
} from './fallback/types.js';

export type { CachePolicy, ProviderCache } from './cache/types.js';
export { createInMemoryProviderCache } from './cache/cache.impl.js';

export type {
  TokenUsage,
  RequestTelemetry,
  ProviderTelemetry,
  TelemetrySpanAttributes,
} from './telemetry/types.js';
export { createProviderTelemetry } from './telemetry/telemetry.impl.js';

export type { CostBreakdown, TokenCostInput, BudgetQuota } from './cost/types.js';
export type { CostCalculator } from './cost/calculator.js';
export { calculateTokenCost, defaultCostCalculator } from './cost/calculator.js';

export type { ProviderPolicy, PolicyEvaluation, PolicyEnforcer } from './policy/types.js';
export { providerPolicySchema } from './policy/types.js';
export { createPolicyEnforcer } from './policy/policy.impl.js';

export type { ProviderQueries } from './queries/provider-queries.js';
export { createProviderQueries, type ProviderQueriesDeps } from './queries/provider-queries.impl.js';

export type { ProviderHubEvent, ProviderSelected, RequestCompleted } from './events/provider-events.js';
export { PROVIDER_EVENT_NAMES } from './events/provider-events.js';

export {
  embeddingRequestSchema,
  visionRequestSchema,
  chatCompletionRequestSchema,
  speechToTextRequestSchema,
  textToSpeechRequestSchema,
  imageGenerationRequestSchema,
  toolDefinitionSchema,
  structuredOutputRequestSchema,
} from './schemas.js';

export type {
  ProviderId,
  ModelId,
  ProviderRequestId,
  OrganizationId,
} from './shared/identifiers.js';
