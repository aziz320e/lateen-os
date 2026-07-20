import 'reflect-metadata';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from '../../src/config/index';
import { AppModule } from '../../src/app.module';
import { ProvisioningService } from '../../src/application/provisioning.service';
import { InMemoryProvisioningRepository } from '../../src/repositories/provisioning-repository';
import { StubStepOrchestrator } from '../../src/orchestrator/step-orchestrator';
import { InMemoryProvisioningQueue } from '../../src/jobs/provisioning-queue';
import { PROVISIONING_STEP_IDS } from '../../src/domain/types';

function createTestApp() {
  const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'fatal', USE_REDIS: 'false' });
  const provisioningService = new ProvisioningService(
    new InMemoryProvisioningRepository(),
    new StubStepOrchestrator(),
    new InMemoryProvisioningQueue(),
  );
  return AppModule.register({ config, provisioningService });
}

describe('Provisioning API', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await NestFactory.create(createTestApp(), new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', service: 'provisioning' });
  });

  it('GET /api/profiles returns profiles', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/profiles' });
    expect(response.statusCode).toBe(200);
    expect(response.json().length).toBe(7);
  });

  it('POST /api/provision provisions printing organization', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/provision',
      payload: {
        organizationName: 'Acme Print',
        profile: 'printing',
        industry: 'printing',
        country: 'SA',
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
        language: 'en',
        employeeCount: 25,
        extensions: ['stripe-connector'],
        aiWorkers: ['printing-planner'],
      },
    });
    expect(response.statusCode).toBe(201);
    const job = response.json();
    expect(job.status).toBe('completed');
    expect(job.steps).toHaveLength(PROVISIONING_STEP_IDS.length);
    expect(job.report).toBeDefined();
    expect(job.report.healthStatus).toBe('healthy');
  });

  it('GET /api/provision/:id returns job', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/provision',
      payload: { organizationName: 'Test Org', profile: 'small-business' },
    });
    const { id } = created.json();
    const response = await app.inject({ method: 'GET', url: `/api/provision/${id}` });
    expect(response.statusCode).toBe(200);
    expect(response.json().id).toBe(id);
  });

  it('GET /api/provision/status returns summary', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/provision/status' });
    expect(response.statusCode).toBe(200);
    expect(response.json().total).toBeGreaterThanOrEqual(1);
  });
});
