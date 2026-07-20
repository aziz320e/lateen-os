/**
 * @lateen-os/integration-contracts
 * Shared integration provider contracts — no business logic, no hub dependency.
 */

export type ConnectorCategory =
  | 'ERP'
  | 'CRM'
  | 'ECOMMERCE'
  | 'ACCOUNTING'
  | 'EMAIL'
  | 'MESSAGING'
  | 'STORAGE'
  | 'CALENDAR'
  | 'PAYMENTS'
  | 'MARKETING'
  | 'AI_PROVIDERS'
  | 'CUSTOM_REST'
  | 'GRAPHQL';

export type AuthMethod = 'OAUTH2' | 'OIDC' | 'API_KEY' | 'BEARER_TOKEN' | 'WEBHOOK_SECRET' | 'BASIC_AUTH';

export type SyncDirection = 'PULL' | 'PUSH' | 'TWO_WAY';

export type SyncMode = 'manual' | 'scheduled' | 'realtime' | 'bidirectional';

export type WebhookEventType =
  | 'installed'
  | 'connected'
  | 'disconnected'
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed';

export interface ConnectorConfiguration {
  readonly settings: Record<string, unknown>;
  readonly authMethod?: AuthMethod;
  readonly webhookUrl?: string;
}

export interface ConnectorHealth {
  readonly status: 'healthy' | 'degraded' | 'down';
  readonly latencyMs: number;
  readonly successRate: number;
  readonly lastCheckedAt: string;
  readonly errors: readonly string[];
}

export interface ProviderMetadata {
  readonly definitionCode: string;
  readonly displayName: string;
  readonly category: ConnectorCategory;
  readonly description: string;
  readonly version: string;
  readonly authMethods: readonly AuthMethod[];
  readonly capabilities: readonly string[];
  readonly openapiSpecUrl?: string;
}

export interface ConnectionTestResult {
  readonly ok: boolean;
  readonly message: string;
  readonly latencyMs?: number;
}

export interface AuthenticationResult {
  readonly ok: boolean;
  readonly credentialsRef?: string;
  readonly expiresAt?: string;
}

export interface SyncPullResult {
  readonly records: unknown[];
  readonly count: number;
  readonly cursor?: string;
}

export interface SyncPushResult {
  readonly accepted: number;
  readonly rejected: number;
  readonly errors?: readonly string[];
}

export interface WebhookRegistration {
  readonly webhookId: string;
  readonly url: string;
  readonly events: readonly WebhookEventType[];
  readonly secretRef?: string;
}

export interface ParsedWebhookEvent {
  readonly type: WebhookEventType;
  readonly payload: unknown;
  readonly receivedAt: string;
}

/** Sync adapter — pull, push, retry, rate limits. */
export interface SyncAdapter {
  pull(config: ConnectorConfiguration, entity: string): Promise<SyncPullResult>;
  push(config: ConnectorConfiguration, entity: string, records: unknown[]): Promise<SyncPushResult>;
  getSupportedModes(): readonly SyncMode[];
  getSupportedEntities(): readonly string[];
}

/** Webhook adapter — registration, verification, event parsing. */
export interface WebhookAdapter {
  register(config: ConnectorConfiguration, events: WebhookEventType[]): Promise<WebhookRegistration>;
  verify(config: ConnectorConfiguration, payload: unknown, signature: string): boolean;
  parseEvent(payload: unknown): ParsedWebhookEvent;
  getSupportedEvents(): readonly WebhookEventType[];
}

/** Health adapter — connection health monitoring. */
export interface HealthAdapter {
  check(config: ConnectorConfiguration): Promise<ConnectorHealth>;
}

/**
 * Connector provider — full provider surface for Integration Hub extensions.
 * Aligns with Integration Hub ConnectorProviderPort plus adapters.
 */
export interface ConnectorProvider {
  readonly definitionCode: string;
  getMetadata(): ProviderMetadata;
  testConnection(config: ConnectorConfiguration): Promise<ConnectionTestResult>;
  authenticate(config: ConnectorConfiguration): Promise<AuthenticationResult>;
  readonly sync: SyncAdapter;
  readonly webhook: WebhookAdapter;
  readonly health: HealthAdapter;
}

/** Hub-compatible port (subset used by Integration Hub today). */
export interface ConnectorProviderPort {
  readonly definitionCode: string;
  testConnection(config: ConnectorConfiguration): Promise<{ ok: boolean; message: string }>;
  authenticate(config: ConnectorConfiguration): Promise<{ ok: boolean; credentialsRef?: string }>;
  pull?(config: ConnectorConfiguration, entity: string): Promise<{ records: unknown[]; count: number }>;
  push?(config: ConnectorConfiguration, entity: string, records: unknown[]): Promise<{ accepted: number }>;
}
