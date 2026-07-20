export {
  BaseConnectorProvider,
  BaseSyncAdapter,
  BaseWebhookAdapter,
  BaseHealthAdapter,
  createConnectorProvider,
} from './base-provider.js';
export type { ProviderConfig, ConnectorManifest } from './base-provider.js';

export {
  PROVIDER_DEFINITIONS,
  getProviderDefinition,
  toProviderConfig,
} from './providers/registry.js';
export type { ProviderDefinition } from './providers/registry.js';

export {
  withTelemetry,
  withRetry,
  mapProviderError,
  validateAuthConfig,
  RateLimitError,
  AuthenticationError,
} from './telemetry.js';

export type {
  ConnectorProvider,
  ConnectorProviderPort,
  SyncAdapter,
  WebhookAdapter,
  HealthAdapter,
  ConnectorConfiguration,
  ConnectorHealth,
  ProviderMetadata,
  WebhookEventType,
  SyncMode,
} from '@lateen-os/integration-contracts';
