import type {
  ConnectorConfiguration,
  ConnectorDefinition,
  ConnectorHealth,
  ConnectorInstance,
  ConnectorLifecycleAction,
  EntityMapping,
  HubJob,
  IntegrationDomainEvent,
  SyncDirection,
  SyncJob,
  WebhookPayload,
} from './types';

export interface ConnectorProviderPort {
  readonly definitionCode: string;
  testConnection(config: ConnectorConfiguration): Promise<{ ok: boolean; message: string }>;
  authenticate(config: ConnectorConfiguration): Promise<{ ok: boolean; credentialsRef?: string }>;
  pull?(config: ConnectorConfiguration, entity: string): Promise<{ records: unknown[]; count: number }>;
  push?(config: ConnectorConfiguration, entity: string, records: unknown[]): Promise<{ accepted: number }>;
}

export interface ConnectorRepositoryPort {
  listDefinitions(): Promise<ConnectorDefinition[]>;
  getDefinition(code: string): Promise<ConnectorDefinition | null>;
  listConnectors(organizationId: string): Promise<ConnectorInstance[]>;
  getConnector(id: string, organizationId: string): Promise<ConnectorInstance | null>;
  saveConnector(connector: ConnectorInstance): Promise<ConnectorInstance>;
  deleteConnector(id: string, organizationId: string): Promise<void>;
}

export interface MappingRepositoryPort {
  listMappings(connectorId: string, organizationId: string): Promise<EntityMapping[]>;
  saveMapping(mapping: EntityMapping): Promise<EntityMapping>;
}

export interface SyncRepositoryPort {
  listSyncJobs(organizationId: string, connectorId?: string): Promise<SyncJob[]>;
  saveSyncJob(job: SyncJob): Promise<SyncJob>;
  recordSyncRun(jobId: string, result: { status: SyncJob['status']; recordsIn: number; recordsOut: number; latencyMs: number; errorMessage?: string }): Promise<void>;
}

export interface JobQueuePort {
  enqueue(job: Omit<HubJob, 'id' | 'queuedAt' | 'status' | 'attempts'>): Promise<HubJob>;
  listJobs(organizationId: string): Promise<HubJob[]>;
  retry(jobId: string): Promise<HubJob | null>;
}

export interface WebhookRepositoryPort {
  registerWebhook(input: { connectorId: string; organizationId: string; eventType: string; targetUrl: string; secretRef?: string }): Promise<{ id: string }>;
  recordDelivery(webhookId: string, payload: WebhookPayload): Promise<void>;
}

export interface IntegrationEventPublisher {
  publish(event: IntegrationDomainEvent): Promise<void>;
  close?(): Promise<void>;
}

export interface ConnectorOrchestratorPort {
  executeLifecycle(
    action: ConnectorLifecycleAction,
    input: { organizationId: string; definitionCode: string; connectorId?: string; configuration?: ConnectorConfiguration },
  ): Promise<ConnectorInstance>;
  getHealth(connectorId: string, organizationId: string): Promise<ConnectorHealth>;
}

export interface SyncOrchestratorPort {
  startSync(input: { organizationId: string; connectorId: string; direction: SyncDirection; schedule?: string }): Promise<SyncJob>;
  runSyncJob(jobId: string, organizationId: string): Promise<SyncJob>;
}
