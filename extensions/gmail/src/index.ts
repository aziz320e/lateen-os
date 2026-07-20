export { connectorManifest } from './manifest.js';
export { provider, default } from './provider.js';
export { syncAdapter } from './adapters/sync.js';
export { webhookAdapter } from './adapters/webhook.js';
export { healthAdapter } from './adapters/health.js';
export type { ConnectorManifest } from '@lateen-os/connector-base';
export type {
  ConnectorProvider,
  SyncAdapter,
  WebhookAdapter,
  HealthAdapter,
} from '@lateen-os/integration-contracts';
