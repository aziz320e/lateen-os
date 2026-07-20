import type {
  AuthenticationResult,
  ConnectorConfiguration,
  ConnectorHealth,
  ConnectionTestResult,
  HealthAdapter,
  ParsedWebhookEvent,
  ProviderMetadata,
  SyncAdapter,
  SyncMode,
  SyncPullResult,
  SyncPushResult,
  WebhookAdapter,
  WebhookEventType,
  WebhookRegistration,
} from '@lateen-os/integration-contracts';
import type { ConnectorManifest } from '@lateen-os/sdk';
import { withRetry, withTelemetry } from './telemetry.js';

export interface ProviderConfig {
  readonly definitionCode: string;
  readonly manifest: ConnectorManifest;
  readonly metadata: ProviderMetadata;
  readonly authRequiredKeys: readonly string[];
  readonly entities: readonly string[];
  readonly syncModes: readonly SyncMode[];
  readonly webhookEvents: readonly WebhookEventType[];
  readonly openapiSpecUrl?: string;
}

export class BaseSyncAdapter implements SyncAdapter {
  constructor(
    private readonly config: ProviderConfig,
    private readonly simulateRecords: (entity: string) => unknown[],
  ) {}

  async pull(config: ConnectorConfiguration, entity: string): Promise<SyncPullResult> {
    return withTelemetry('sync.pull', this.config.definitionCode, async () =>
      withRetry(async () => {
        const records = this.simulateRecords(entity);
        return { records, count: records.length };
      }),
    );
  }

  async push(config: ConnectorConfiguration, entity: string, records: unknown[]): Promise<SyncPushResult> {
    return withTelemetry('sync.push', this.config.definitionCode, async () =>
      withRetry(async () => ({
        accepted: records.length,
        rejected: 0,
      })),
    );
  }

  getSupportedModes(): readonly SyncMode[] {
    return this.config.syncModes;
  }

  getSupportedEntities(): readonly string[] {
    return this.config.entities;
  }
}

export class BaseWebhookAdapter implements WebhookAdapter {
  constructor(private readonly config: ProviderConfig) {}

  async register(
    config: ConnectorConfiguration,
    events: WebhookEventType[],
  ): Promise<WebhookRegistration> {
    return withTelemetry('webhook.register', this.config.definitionCode, async () => ({
      webhookId: `${this.config.definitionCode}-wh-${Date.now()}`,
      url: config.webhookUrl ?? `https://hooks.lateen.os/${this.config.definitionCode}`,
      events,
      secretRef: `whsec-${this.config.definitionCode}`,
    }));
  }

  verify(_config: ConnectorConfiguration, _payload: unknown, signature: string): boolean {
    return signature.length > 0;
  }

  parseEvent(payload: unknown): ParsedWebhookEvent {
    const body = payload as Record<string, unknown>;
    const type = (body.type as WebhookEventType) ?? 'sync_completed';
    return {
      type,
      payload,
      receivedAt: new Date().toISOString(),
    };
  }

  getSupportedEvents(): readonly WebhookEventType[] {
    return this.config.webhookEvents;
  }
}

export class BaseHealthAdapter implements HealthAdapter {
  constructor(private readonly config: ProviderConfig) {}

  async check(config: ConnectorConfiguration): Promise<ConnectorHealth> {
    return withTelemetry('health.check', this.config.definitionCode, async () => {
      const start = Date.now();
      const hasCredentials = this.config.authRequiredKeys.every((k) => Boolean(config.settings[k]));
      const latencyMs = Date.now() - start + 12;
      return {
        status: hasCredentials ? 'healthy' : 'degraded',
        latencyMs,
        successRate: hasCredentials ? 1 : 0.5,
        lastCheckedAt: new Date().toISOString(),
        errors: hasCredentials ? [] : ['Credentials not configured'],
      };
    });
  }
}

export class BaseConnectorProvider {
  readonly sync: SyncAdapter;
  readonly webhook: WebhookAdapter;
  readonly health: HealthAdapter;

  constructor(private readonly config: ProviderConfig) {
    this.sync = new BaseSyncAdapter(config, (entity) => [
      { id: `${entity}-1`, source: config.definitionCode, syncedAt: new Date().toISOString() },
    ]);
    this.webhook = new BaseWebhookAdapter(config);
    this.health = new BaseHealthAdapter(config);
  }

  get definitionCode(): string {
    return this.config.definitionCode;
  }

  get connectorManifest(): ConnectorManifest {
    return this.config.manifest;
  }

  getMetadata(): ProviderMetadata {
    return this.config.metadata;
  }

  async testConnection(config: ConnectorConfiguration): Promise<ConnectionTestResult> {
    return withTelemetry('testConnection', this.config.definitionCode, async () => {
      const start = Date.now();
      const health = await this.health.check(config);
      return {
        ok: health.status !== 'down',
        message: health.status === 'healthy' ? 'Connection OK' : 'Connection degraded — check credentials',
        latencyMs: Date.now() - start,
      };
    });
  }

  async authenticate(config: ConnectorConfiguration): Promise<AuthenticationResult> {
    return withTelemetry('authenticate', this.config.definitionCode, async () => {
      const hasCredentials = this.config.authRequiredKeys.every((k) => Boolean(config.settings[k]));
      if (!hasCredentials) {
        return { ok: false };
      }
      return {
        ok: true,
        credentialsRef: `cred-${this.config.definitionCode}-${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      };
    });
  }

  /** Hub-compatible port adapter */
  toHubPort() {
    const self = this;
    return {
      definitionCode: self.definitionCode,
      testConnection: async (config: ConnectorConfiguration) => {
        const result = await self.testConnection(config);
        return { ok: result.ok, message: result.message };
      },
      authenticate: async (config: ConnectorConfiguration) => {
        const result = await self.authenticate(config);
        return { ok: result.ok, credentialsRef: result.credentialsRef };
      },
      pull: async (config: ConnectorConfiguration, entity: string) => {
        const result = await self.sync.pull(config, entity);
        return { records: result.records, count: result.count };
      },
      push: async (config: ConnectorConfiguration, entity: string, records: unknown[]) => {
        const result = await self.sync.push(config, entity, records);
        return { accepted: result.accepted };
      },
    };
  }
}

export function createConnectorProvider(config: ProviderConfig): BaseConnectorProvider {
  return new BaseConnectorProvider(config);
}

export type { ConnectorManifest };
