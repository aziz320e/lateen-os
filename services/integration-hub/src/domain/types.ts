/** Integration Hub domain types — contracts only, no external API calls. */

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

export type ConnectorLifecycleAction =
  | 'install'
  | 'configure'
  | 'authenticate'
  | 'test'
  | 'enable'
  | 'disable'
  | 'upgrade'
  | 'remove';

export type ConnectorStatus =
  | 'INSTALLED'
  | 'CONFIGURED'
  | 'AUTHENTICATED'
  | 'ENABLED'
  | 'DISABLED'
  | 'ERROR'
  | 'REMOVED';

export type SyncDirection = 'PULL' | 'PUSH' | 'TWO_WAY';

export type SyncJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTER';

export type HubJobType = 'SYNC' | 'IMPORT' | 'EXPORT' | 'RETRY' | 'CLEANUP';

export interface ConnectorDefinition {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly category: ConnectorCategory;
  readonly description: string;
  readonly version: string;
  readonly authMethods: readonly AuthMethod[];
  readonly capabilities: readonly string[];
}

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

export interface ConnectorInstance {
  readonly id: string;
  readonly organizationId: string;
  readonly definitionCode: string;
  readonly name: string;
  readonly status: ConnectorStatus;
  readonly configuration: ConnectorConfiguration;
  readonly health: ConnectorHealth;
  readonly installedAt: string;
  readonly updatedAt: string;
}

export interface EntityMapping {
  readonly id: string;
  readonly connectorId: string;
  readonly organizationId: string;
  readonly externalEntity: string;
  readonly internalEntity: string;
  readonly transformation: Record<string, unknown>;
  readonly validation: Record<string, unknown>;
  readonly schemaVersion: string;
}

export interface SyncJob {
  readonly id: string;
  readonly connectorId: string;
  readonly organizationId: string;
  readonly direction: SyncDirection;
  readonly schedule?: string;
  readonly status: SyncJobStatus;
  readonly lastRunAt?: string;
  readonly stats: SyncStats;
}

export interface SyncStats {
  readonly recordsIn: number;
  readonly recordsOut: number;
  readonly successRate: number;
  readonly queueLength: number;
}

export interface HubJob {
  readonly id: string;
  readonly organizationId: string;
  readonly type: HubJobType;
  readonly connectorId?: string;
  readonly status: string;
  readonly attempts: number;
  readonly queuedAt: string;
}

export interface WebhookPayload {
  readonly eventType: string;
  readonly connectorId: string;
  readonly payload: Record<string, unknown>;
  readonly receivedAt: string;
}

export type IntegrationEventName =
  | 'ConnectorInstalled'
  | 'ConnectorEnabled'
  | 'ConnectorDisabled'
  | 'SyncStarted'
  | 'SyncCompleted'
  | 'SyncFailed'
  | 'WebhookReceived'
  | 'JobQueued';

export interface IntegrationDomainEvent {
  readonly eventId: string;
  readonly eventName: IntegrationEventName;
  readonly organizationId: string;
  readonly occurredAt: string;
  readonly payload: Record<string, unknown>;
}

export interface MonitoringSnapshot {
  readonly connectorHealth: readonly { connectorId: string; health: ConnectorHealth }[];
  readonly syncStatus: readonly { jobId: string; status: SyncJobStatus }[];
  readonly queueLength: number;
  readonly errorCount: number;
  readonly averageLatencyMs: number;
}
