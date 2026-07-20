import 'reflect-metadata';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from '../../src/config/index';
import { AppModule } from '../../src/app.module';
import { createInMemoryRepositories } from '../../src/repositories/integration-repositories';
import { NoOpIntegrationEventPublisher } from '../../src/events/nats-publisher';
import { InMemoryJobQueue } from '../../src/jobs/job-queue';
import { ConnectorService, MonitoringService, SyncService } from '../../src/application/integration.services';
import { WebhookService } from '../../src/webhooks/webhook.service';
import { JobService } from '../../src/jobs/job.service';
import { MappingService } from '../../src/mapping/mapping.service';
import { getMockProvider } from '../../src/connectors/mock-provider';
import { CONNECTOR_CATALOG } from '../../src/connectors/catalog';

const ORG_A = '00000000-0000-4000-8000-000000000001';
const ORG_B = '00000000-0000-4000-8000-000000000002';

function createTestApp(configOverrides: Record<string, string> = {}) {
  const config = loadConfig({
    NODE_ENV: 'test',
    LOG_LEVEL: 'fatal',
    USE_REDIS: 'false',
    USE_NATS: 'false',
    ...configOverrides,
  });

  const repos = createInMemoryRepositories();
  const events = new NoOpIntegrationEventPublisher();
  const jobs = new InMemoryJobQueue();

  return {
    config,
    repos,
    appModule: AppModule.register({
      config,
      connectorService: new ConnectorService(repos.connectors, events),
      syncService: new SyncService(repos.connectors, repos.sync, jobs, events),
      webhookService: new WebhookService(repos.connectors, repos.webhooks, events),
      jobService: new JobService(jobs),
      mappingService: new MappingService(repos.mappings),
      monitoringService: new MonitoringService(repos.connectors, repos.sync, jobs),
    }),
  };
}

describe('Integration Hub API', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const { appModule } = createTestApp();
    app = await NestFactory.create(appModule, new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', service: 'integration-hub' });
  });

  it('GET /api/connectors/definitions returns catalog', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/connectors/definitions' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(CONNECTOR_CATALOG.length);
  });

  it('POST /api/connectors installs a connector', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/connectors',
      headers: { 'x-organization-id': ORG_A },
      payload: { definitionCode: 'stripe' },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.definitionCode).toBe('stripe');
    expect(body.status).toBe('INSTALLED');
  });

  it('connector lifecycle: configure → authenticate → test → enable', async () => {
    const install = await app.inject({
      method: 'POST',
      url: '/api/connectors',
      headers: { 'x-organization-id': ORG_A },
      payload: { definitionCode: 'slack' },
    });
    const connectorId = install.json().id;

    for (const action of ['configure', 'authenticate', 'test', 'enable'] as const) {
      const res = await app.inject({
        method: 'POST',
        url: `/api/connectors/${connectorId}/lifecycle`,
        headers: { 'x-organization-id': ORG_A },
        payload: { action, configuration: { settings: { workspace: 'mock' } } },
      });
      expect(res.statusCode).toBe(201);
    }

    const enabled = await app.inject({
      method: 'GET',
      url: `/api/connectors/${connectorId}`,
      headers: { 'x-organization-id': ORG_A },
    });
    expect(enabled.json().status).toBe('ENABLED');
  });

  it('sync job runs with mock provider', async () => {
    const install = await app.inject({
      method: 'POST',
      url: '/api/connectors',
      headers: { 'x-organization-id': ORG_A },
      payload: { definitionCode: 'shopify' },
    });
    const connectorId = install.json().id;

    await app.inject({
      method: 'POST',
      url: `/api/connectors/${connectorId}/lifecycle`,
      headers: { 'x-organization-id': ORG_A },
      payload: { action: 'enable' },
    });

    const start = await app.inject({
      method: 'POST',
      url: '/api/sync',
      headers: { 'x-organization-id': ORG_A },
      payload: { connectorId, direction: 'PULL' },
    });
    const jobId = start.json().id;

    const run = await app.inject({
      method: 'POST',
      url: `/api/sync/${jobId}/run`,
      headers: { 'x-organization-id': ORG_A },
    });
    expect(run.statusCode).toBe(201);
    expect(run.json().status).toBe('COMPLETED');
    expect(run.json().stats.recordsIn).toBeGreaterThan(0);
  });

  it('tenant isolation prevents cross-org connector access', async () => {
    const install = await app.inject({
      method: 'POST',
      url: '/api/connectors',
      headers: { 'x-organization-id': ORG_A },
      payload: { definitionCode: 'gmail' },
    });
    const connectorId = install.json().id;

    const crossOrg = await app.inject({
      method: 'GET',
      url: `/api/connectors/${connectorId}`,
      headers: { 'x-organization-id': ORG_B },
    });
    expect(crossOrg.statusCode).toBe(404);
  });

  it('POST /api/webhooks/inbound accepts payload', async () => {
    const install = await app.inject({
      method: 'POST',
      url: '/api/connectors',
      headers: { 'x-organization-id': ORG_A },
      payload: { definitionCode: 'stripe' },
    });
    const connectorId = install.json().id;

    const response = await app.inject({
      method: 'POST',
      url: `/api/webhooks/inbound/${connectorId}`,
      headers: { 'x-organization-id': ORG_A },
      payload: { eventType: 'payment.succeeded', amount: 100 },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().eventType).toBe('payment.succeeded');
  });
});

describe('Mock connector provider', () => {
  it('simulates pull/push without network', async () => {
    const provider = getMockProvider('openai');
    const connection = await provider.testConnection({ settings: {} });
    expect(connection.ok).toBe(true);

    const pulled = await provider.pull!({ settings: {} }, 'embeddings');
    expect(pulled.count).toBe(1);

    const pushed = await provider.push!({ settings: {} }, 'embeddings', [{ vector: [0.1] }]);
    expect(pushed.accepted).toBe(1);
  });
});
