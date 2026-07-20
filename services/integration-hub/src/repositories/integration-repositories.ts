import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/integration-hub-client';
import { CONNECTOR_CATALOG, getConnectorDefinition } from '../connectors/catalog';
import type {
  ConnectorConfiguration,
  ConnectorDefinition,
  ConnectorHealth,
  ConnectorInstance,
  EntityMapping,
  SyncJob,
  WebhookPayload,
} from '../domain/types';
import type {
  ConnectorRepositoryPort,
  MappingRepositoryPort,
  SyncRepositoryPort,
  WebhookRepositoryPort,
} from '../domain/ports';

function defaultHealth(): ConnectorHealth {
  return {
    status: 'healthy',
    latencyMs: 12,
    successRate: 1,
    lastCheckedAt: new Date().toISOString(),
    errors: [],
  };
}

function mapConnector(row: {
  id: string;
  organizationId: string;
  definitionCode: string;
  name: string;
  status: string;
  configuration: unknown;
  health: unknown;
  installedAt: Date;
  updatedAt: Date;
}): ConnectorInstance {
  return {
    id: row.id,
    organizationId: row.organizationId,
    definitionCode: row.definitionCode,
    name: row.name,
    status: row.status as ConnectorInstance['status'],
    configuration: (row.configuration ?? {}) as ConnectorConfiguration,
    health: (row.health ?? defaultHealth()) as ConnectorHealth,
    installedAt: row.installedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapSyncJob(row: {
  id: string;
  connectorId: string;
  organizationId: string;
  direction: string;
  schedule: string | null;
  status: string;
  lastRunAt: Date | null;
  stats: unknown;
}): SyncJob {
  const stats = (row.stats ?? {}) as SyncJob['stats'];
  return {
    id: row.id,
    connectorId: row.connectorId,
    organizationId: row.organizationId,
    direction: row.direction as SyncJob['direction'],
    schedule: row.schedule ?? undefined,
    status: row.status as SyncJob['status'],
    lastRunAt: row.lastRunAt?.toISOString(),
    stats: {
      recordsIn: stats.recordsIn ?? 0,
      recordsOut: stats.recordsOut ?? 0,
      successRate: stats.successRate ?? 0,
      queueLength: stats.queueLength ?? 0,
    },
  };
}

export class PrismaConnectorRepository implements ConnectorRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async listDefinitions(): Promise<ConnectorDefinition[]> {
    const db = await this.prisma.connectorDefinitionRecord.findMany();
    if (db.length === 0) return CONNECTOR_CATALOG;
    return db.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      category: r.category as ConnectorDefinition['category'],
      description: r.description ?? '',
      version: r.version,
      authMethods: r.authMethods as ConnectorDefinition['authMethods'][number][],
      capabilities: (r.capabilities as string[]) ?? [],
    }));
  }

  async getDefinition(code: string): Promise<ConnectorDefinition | null> {
    const db = await this.prisma.connectorDefinitionRecord.findUnique({ where: { code } });
    if (db) {
      return {
        id: db.id,
        code: db.code,
        name: db.name,
        category: db.category as ConnectorDefinition['category'],
        description: db.description ?? '',
        version: db.version,
        authMethods: db.authMethods as ConnectorDefinition['authMethods'][number][],
        capabilities: (db.capabilities as string[]) ?? [],
      };
    }
    return getConnectorDefinition(code) ?? null;
  }

  async listConnectors(organizationId: string): Promise<ConnectorInstance[]> {
    const rows = await this.prisma.connector.findMany({ where: { organizationId, status: { not: 'REMOVED' } } });
    return rows.map(mapConnector);
  }

  async getConnector(id: string, organizationId: string): Promise<ConnectorInstance | null> {
    const row = await this.prisma.connector.findFirst({ where: { id, organizationId } });
    return row ? mapConnector(row) : null;
  }

  async saveConnector(connector: ConnectorInstance): Promise<ConnectorInstance> {
    const row = await this.prisma.connector.upsert({
      where: { id: connector.id },
      create: {
        id: connector.id,
        organizationId: connector.organizationId,
        definitionCode: connector.definitionCode,
        name: connector.name,
        status: connector.status,
        configuration: connector.configuration as object,
        health: connector.health as object,
        installedAt: new Date(connector.installedAt),
      },
      update: {
        name: connector.name,
        status: connector.status,
        configuration: connector.configuration as object,
        health: connector.health as object,
      },
    });
    return mapConnector(row);
  }

  async deleteConnector(id: string, organizationId: string): Promise<void> {
    await this.prisma.connector.updateMany({
      where: { id, organizationId },
      data: { status: 'REMOVED' },
    });
  }
}

export class PrismaSyncRepository implements SyncRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async listSyncJobs(organizationId: string, connectorId?: string): Promise<SyncJob[]> {
    const rows = await this.prisma.syncJob.findMany({
      where: { organizationId, ...(connectorId ? { connectorId } : {}) },
    });
    return rows.map(mapSyncJob);
  }

  async saveSyncJob(job: SyncJob): Promise<SyncJob> {
    const row = await this.prisma.syncJob.upsert({
      where: { id: job.id },
      create: {
        id: job.id,
        connectorId: job.connectorId,
        organizationId: job.organizationId,
        direction: job.direction,
        schedule: job.schedule,
        status: job.status,
        stats: job.stats as object,
      },
      update: {
        status: job.status,
        schedule: job.schedule,
        stats: job.stats as object,
        lastRunAt: job.lastRunAt ? new Date(job.lastRunAt) : undefined,
      },
    });
    return mapSyncJob(row);
  }

  async recordSyncRun(
    jobId: string,
    result: { status: SyncJob['status']; recordsIn: number; recordsOut: number; latencyMs: number; errorMessage?: string },
  ): Promise<void> {
    await this.prisma.syncRun.create({
      data: {
        syncJobId: jobId,
        status: result.status,
        recordsIn: result.recordsIn,
        recordsOut: result.recordsOut,
        latencyMs: result.latencyMs,
        errorMessage: result.errorMessage,
        completedAt: new Date(),
      },
    });
    await this.prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: result.status,
        lastRunAt: new Date(),
        stats: {
          recordsIn: result.recordsIn,
          recordsOut: result.recordsOut,
          successRate: result.status === 'COMPLETED' ? 1 : 0,
          queueLength: 0,
        },
      },
    });
  }
}

export class PrismaMappingRepository implements MappingRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async listMappings(connectorId: string, organizationId: string): Promise<EntityMapping[]> {
    const rows = await this.prisma.entityMapping.findMany({ where: { connectorId, organizationId } });
    return rows.map((r) => ({
      id: r.id,
      connectorId: r.connectorId,
      organizationId: r.organizationId,
      externalEntity: r.externalEntity,
      internalEntity: r.internalEntity,
      transformation: (r.transformation as Record<string, unknown>) ?? {},
      validation: (r.validation as Record<string, unknown>) ?? {},
      schemaVersion: r.schemaVersion,
    }));
  }

  async saveMapping(mapping: EntityMapping): Promise<EntityMapping> {
    const row = await this.prisma.entityMapping.upsert({
      where: { id: mapping.id },
      create: {
        id: mapping.id,
        connectorId: mapping.connectorId,
        organizationId: mapping.organizationId,
        externalEntity: mapping.externalEntity,
        internalEntity: mapping.internalEntity,
        transformation: mapping.transformation as object,
        validation: mapping.validation as object,
        schemaVersion: mapping.schemaVersion,
      },
      update: {
        externalEntity: mapping.externalEntity,
        internalEntity: mapping.internalEntity,
        transformation: mapping.transformation as object,
        validation: mapping.validation as object,
        schemaVersion: mapping.schemaVersion,
      },
    });
    return {
      id: row.id,
      connectorId: row.connectorId,
      organizationId: row.organizationId,
      externalEntity: row.externalEntity,
      internalEntity: row.internalEntity,
      transformation: (row.transformation as Record<string, unknown>) ?? {},
      validation: (row.validation as Record<string, unknown>) ?? {},
      schemaVersion: row.schemaVersion,
    };
  }
}

export class PrismaWebhookRepository implements WebhookRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async registerWebhook(input: {
    connectorId: string;
    organizationId: string;
    eventType: string;
    targetUrl: string;
    secretRef?: string;
  }): Promise<{ id: string }> {
    const row = await this.prisma.webhookSubscription.create({
      data: {
        connectorId: input.connectorId,
        organizationId: input.organizationId,
        eventType: input.eventType,
        targetUrl: input.targetUrl,
        secretRef: input.secretRef,
      },
    });
    return { id: row.id };
  }

  async recordDelivery(webhookId: string, payload: WebhookPayload): Promise<void> {
    await this.prisma.webhookDelivery.create({
      data: {
        webhookId,
        payload: payload as object,
        status: 'received',
        receivedAt: new Date(payload.receivedAt),
      },
    });
  }
}

export class InMemoryConnectorRepository implements ConnectorRepositoryPort {
  private connectors = new Map<string, ConnectorInstance>();

  listDefinitions(): Promise<ConnectorDefinition[]> {
    return Promise.resolve(CONNECTOR_CATALOG);
  }

  getDefinition(code: string): Promise<ConnectorDefinition | null> {
    return Promise.resolve(getConnectorDefinition(code) ?? null);
  }

  listConnectors(organizationId: string): Promise<ConnectorInstance[]> {
    return Promise.resolve(
      [...this.connectors.values()].filter((c) => c.organizationId === organizationId && c.status !== 'REMOVED'),
    );
  }

  getConnector(id: string, organizationId: string): Promise<ConnectorInstance | null> {
    const c = this.connectors.get(id);
    return Promise.resolve(c && c.organizationId === organizationId ? c : null);
  }

  saveConnector(connector: ConnectorInstance): Promise<ConnectorInstance> {
    this.connectors.set(connector.id, connector);
    return Promise.resolve(connector);
  }

  deleteConnector(id: string, organizationId: string): Promise<void> {
    const c = this.connectors.get(id);
    if (c && c.organizationId === organizationId) {
      this.connectors.set(id, { ...c, status: 'REMOVED' });
    }
    return Promise.resolve();
  }
}

export class InMemorySyncRepository implements SyncRepositoryPort {
  private jobs = new Map<string, SyncJob>();

  listSyncJobs(organizationId: string, connectorId?: string): Promise<SyncJob[]> {
    return Promise.resolve(
      [...this.jobs.values()].filter(
        (j) => j.organizationId === organizationId && (!connectorId || j.connectorId === connectorId),
      ),
    );
  }

  saveSyncJob(job: SyncJob): Promise<SyncJob> {
    this.jobs.set(job.id, job);
    return Promise.resolve(job);
  }

  recordSyncRun(
    jobId: string,
    result: { status: SyncJob['status']; recordsIn: number; recordsOut: number; latencyMs: number; errorMessage?: string },
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      this.jobs.set(jobId, {
        ...job,
        status: result.status,
        lastRunAt: new Date().toISOString(),
        stats: {
          recordsIn: result.recordsIn,
          recordsOut: result.recordsOut,
          successRate: result.status === 'COMPLETED' ? 1 : 0,
          queueLength: 0,
        },
      });
    }
    return Promise.resolve();
  }
}

export class InMemoryMappingRepository implements MappingRepositoryPort {
  private mappings = new Map<string, EntityMapping>();

  listMappings(connectorId: string, organizationId: string): Promise<EntityMapping[]> {
    return Promise.resolve(
      [...this.mappings.values()].filter((m) => m.connectorId === connectorId && m.organizationId === organizationId),
    );
  }

  saveMapping(mapping: EntityMapping): Promise<EntityMapping> {
    this.mappings.set(mapping.id, mapping);
    return Promise.resolve(mapping);
  }
}

export class InMemoryWebhookRepository implements WebhookRepositoryPort {
  private webhooks = new Map<
    string,
    { id: string; connectorId: string; organizationId: string; eventType: string; targetUrl: string }
  >();
  private deliveries: WebhookPayload[] = [];

  registerWebhook(input: {
    connectorId: string;
    organizationId: string;
    eventType: string;
    targetUrl: string;
    secretRef?: string;
  }) {
    const id = randomUUID();
    this.webhooks.set(id, { id, ...input });
    return Promise.resolve({ id });
  }

  recordDelivery(_webhookId: string, payload: WebhookPayload): Promise<void> {
    this.deliveries.push(payload);
    return Promise.resolve();
  }
}

export interface IntegrationRepositories {
  connectors: ConnectorRepositoryPort;
  sync: SyncRepositoryPort;
  mappings: MappingRepositoryPort;
  webhooks: WebhookRepositoryPort;
}

export function createInMemoryRepositories(): IntegrationRepositories {
  return {
    connectors: new InMemoryConnectorRepository(),
    sync: new InMemorySyncRepository(),
    mappings: new InMemoryMappingRepository(),
    webhooks: new InMemoryWebhookRepository(),
  };
}

export function createRepositories(prisma: PrismaClient): IntegrationRepositories {
  return {
    connectors: new PrismaConnectorRepository(prisma),
    sync: new PrismaSyncRepository(prisma),
    mappings: new PrismaMappingRepository(prisma),
    webhooks: new PrismaWebhookRepository(prisma),
  };
}
