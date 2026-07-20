import { randomUUID } from 'node:crypto';
import { getMockProvider } from '../connectors/mock-provider';
import type {
  ConnectorConfiguration,
  ConnectorHealth,
  ConnectorInstance,
  ConnectorLifecycleAction,
  IntegrationDomainEvent,
  SyncDirection,
  SyncJob,
} from '../domain/types';
import type {
  ConnectorOrchestratorPort,
  ConnectorRepositoryPort,
  IntegrationEventPublisher,
  JobQueuePort,
  SyncOrchestratorPort,
  SyncRepositoryPort,
} from '../domain/ports';

function defaultHealth(): ConnectorHealth {
  return { status: 'healthy', latencyMs: 15, successRate: 1, lastCheckedAt: new Date().toISOString(), errors: [] };
}

export class ConnectorService implements ConnectorOrchestratorPort {
  constructor(
    private readonly connectors: ConnectorRepositoryPort,
    private readonly events: IntegrationEventPublisher,
  ) {}

  async executeLifecycle(
    action: ConnectorLifecycleAction,
    input: { organizationId: string; definitionCode: string; connectorId?: string; configuration?: ConnectorConfiguration },
  ): Promise<ConnectorInstance> {
    let connector: ConnectorInstance;

    switch (action) {
      case 'install': {
        const definition = await this.connectors.getDefinition(input.definitionCode);
        if (!definition) throw new Error(`Unknown connector: ${input.definitionCode}`);
        connector = {
          id: randomUUID(),
          organizationId: input.organizationId,
          definitionCode: input.definitionCode,
          name: definition.name,
          status: 'INSTALLED',
          configuration: input.configuration ?? { settings: {} },
          health: defaultHealth(),
          installedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await this.events.publish(this.event('ConnectorInstalled', input.organizationId, { connectorId: connector.id, code: input.definitionCode }));
        break;
      }
      case 'configure': {
        connector = await this.requireConnector(input.connectorId!, input.organizationId);
        connector = { ...connector, status: 'CONFIGURED', configuration: input.configuration ?? connector.configuration, updatedAt: new Date().toISOString() };
        break;
      }
      case 'authenticate': {
        connector = await this.requireConnector(input.connectorId!, input.organizationId);
        const authProvider = getMockProvider(connector.definitionCode);
        const auth = await authProvider.authenticate(connector.configuration);
        if (!auth.ok) throw new Error('Authentication failed');
        connector = { ...connector, status: 'AUTHENTICATED', updatedAt: new Date().toISOString() };
        break;
      }
      case 'test': {
        connector = await this.requireConnector(input.connectorId!, input.organizationId);
        const testProvider = getMockProvider(connector.definitionCode);
        const test = await testProvider.testConnection(connector.configuration);
        connector = {
          ...connector,
          health: {
            ...connector.health,
            status: test.ok ? 'healthy' : 'down',
            errors: test.ok ? [] : [test.message],
            lastCheckedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        };
        break;
      }
      case 'enable': {
        connector = await this.requireConnector(input.connectorId!, input.organizationId);
        connector = { ...connector, status: 'ENABLED', updatedAt: new Date().toISOString() };
        await this.events.publish(this.event('ConnectorEnabled', input.organizationId, { connectorId: connector.id }));
        break;
      }
      case 'disable': {
        connector = await this.requireConnector(input.connectorId!, input.organizationId);
        connector = { ...connector, status: 'DISABLED', updatedAt: new Date().toISOString() };
        await this.events.publish(this.event('ConnectorDisabled', input.organizationId, { connectorId: connector.id }));
        break;
      }
      case 'upgrade': {
        connector = await this.requireConnector(input.connectorId!, input.organizationId);
        connector = { ...connector, updatedAt: new Date().toISOString() };
        break;
      }
      case 'remove': {
        connector = await this.requireConnector(input.connectorId!, input.organizationId);
        await this.connectors.deleteConnector(connector.id, input.organizationId);
        return { ...connector, status: 'REMOVED' };
      }
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return this.connectors.saveConnector(connector);
  }

  async getHealth(connectorId: string, organizationId: string): Promise<ConnectorHealth> {
    const connector = await this.requireConnector(connectorId, organizationId);
    return connector.health;
  }

  async listDefinitions() {
    return this.connectors.listDefinitions();
  }

  async listConnectors(organizationId: string) {
    return this.connectors.listConnectors(organizationId);
  }

  async getConnector(id: string, organizationId: string) {
    return this.connectors.getConnector(id, organizationId);
  }

  private async requireConnector(id: string, organizationId: string): Promise<ConnectorInstance> {
    const c = await this.connectors.getConnector(id, organizationId);
    if (!c) throw new Error('Connector not found');
    return c;
  }

  private event(name: IntegrationDomainEvent['eventName'], organizationId: string, payload: Record<string, unknown>): IntegrationDomainEvent {
    return { eventId: randomUUID(), eventName: name, organizationId, occurredAt: new Date().toISOString(), payload };
  }
}

export class SyncService implements SyncOrchestratorPort {
  constructor(
    private readonly connectors: ConnectorRepositoryPort,
    private readonly sync: SyncRepositoryPort,
    private readonly jobs: JobQueuePort,
    private readonly events: IntegrationEventPublisher,
  ) {}

  async startSync(input: { organizationId: string; connectorId: string; direction: SyncDirection; schedule?: string }): Promise<SyncJob> {
    const connector = await this.connectors.getConnector(input.connectorId, input.organizationId);
    if (!connector) throw new Error('Connector not found');

    const job: SyncJob = {
      id: randomUUID(),
      connectorId: input.connectorId,
      organizationId: input.organizationId,
      direction: input.direction,
      schedule: input.schedule,
      status: 'PENDING',
      stats: { recordsIn: 0, recordsOut: 0, successRate: 0, queueLength: 0 },
    };

    await this.sync.saveSyncJob(job);
    await this.jobs.enqueue({ organizationId: input.organizationId, type: 'SYNC', connectorId: input.connectorId });
    await this.events.publish({
      eventId: randomUUID(),
      eventName: 'SyncStarted',
      organizationId: input.organizationId,
      occurredAt: new Date().toISOString(),
      payload: { jobId: job.id, connectorId: input.connectorId },
    });

    return job;
  }

  async runSyncJob(jobId: string, organizationId: string): Promise<SyncJob> {
    const jobs = await this.sync.listSyncJobs(organizationId);
    const job = jobs.find((j) => j.id === jobId);
    if (!job) throw new Error('Sync job not found');

    const connector = await this.connectors.getConnector(job.connectorId, organizationId);
    if (!connector) throw new Error('Connector not found');

    const provider = getMockProvider(connector.definitionCode);
    const start = Date.now();

    try {
      let recordsIn = 0;
      let recordsOut = 0;

      if (job.direction === 'PULL' || job.direction === 'TWO_WAY') {
        const pulled = await provider.pull?.(connector.configuration, 'default') ?? { records: [], count: 0 };
        recordsIn = pulled.count;
      }
      if (job.direction === 'PUSH' || job.direction === 'TWO_WAY') {
        const pushed = await provider.push?.(connector.configuration, 'default', [{ mock: true }]) ?? { accepted: 0 };
        recordsOut = pushed.accepted;
      }

      const latencyMs = Date.now() - start;
      await this.sync.recordSyncRun(jobId, { status: 'COMPLETED', recordsIn, recordsOut, latencyMs });

      await this.events.publish({
        eventId: randomUUID(),
        eventName: 'SyncCompleted',
        organizationId,
        occurredAt: new Date().toISOString(),
        payload: { jobId, recordsIn, recordsOut, latencyMs },
      });

      const updated = (await this.sync.listSyncJobs(organizationId)).find((j) => j.id === jobId)!;
      return updated;
    } catch (error) {
      await this.sync.recordSyncRun(jobId, {
        status: 'FAILED',
        recordsIn: 0,
        recordsOut: 0,
        latencyMs: Date.now() - start,
        errorMessage: error instanceof Error ? error.message : 'Sync failed',
      });
      await this.events.publish({
        eventId: randomUUID(),
        eventName: 'SyncFailed',
        organizationId,
        occurredAt: new Date().toISOString(),
        payload: { jobId, error: error instanceof Error ? error.message : 'unknown' },
      });
      throw error;
    }
  }

  async listSyncJobs(organizationId: string, connectorId?: string) {
    return this.sync.listSyncJobs(organizationId, connectorId);
  }
}

export class MonitoringService {
  constructor(
    private readonly connectors: ConnectorRepositoryPort,
    private readonly sync: SyncRepositoryPort,
    private readonly jobs: JobQueuePort,
  ) {}

  async getSnapshot(organizationId: string) {
    const connectors = await this.connectors.listConnectors(organizationId);
    const syncJobs = await this.sync.listSyncJobs(organizationId);
    const hubJobs = await this.jobs.listJobs(organizationId);

    const latencies = connectors.map((c) => c.health.latencyMs);
    const averageLatencyMs = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

    return {
      connectorHealth: connectors.map((c) => ({ connectorId: c.id, health: c.health })),
      syncStatus: syncJobs.map((j) => ({ jobId: j.id, status: j.status })),
      queueLength: hubJobs.filter((j) => j.status === 'queued').length,
      errorCount: syncJobs.filter((j) => j.status === 'FAILED' || j.status === 'DEAD_LETTER').length,
      averageLatencyMs,
    };
  }
}
