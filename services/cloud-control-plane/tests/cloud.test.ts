import 'reflect-metadata';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from '../src/config/index';
import { AppModule } from '../src/app.module';
import { createCloudService } from '../src/bootstrap/factory';
import { CLOUD_DOMAINS, SUBSCRIPTION_PLANS, TENANT_LIFECYCLE_ACTIONS } from '../src/domain/types';

function createTestApp() {
  const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'fatal', USE_REDIS: 'false' });
  return AppModule.register({ config, cloudService: createCloudService(config) });
}

describe('Cloud Control Plane API', () => {
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
    expect(response.json()).toMatchObject({ status: 'ok', service: 'cloud-control-plane' });
  });

  it('GET /api/cloud returns overview', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/cloud' });
    expect(response.statusCode).toBe(200);
    expect(response.json().organizations).toBeGreaterThan(0);
  });

  it('GET /api/cloud/domains returns domains', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/cloud/domains' });
    expect(response.statusCode).toBe(200);
    expect(response.json().domains.length).toBe(CLOUD_DOMAINS.length);
    expect(response.json().plans.length).toBe(SUBSCRIPTION_PLANS.length);
    expect(response.json().lifecycle.length).toBe(TENANT_LIFECYCLE_ACTIONS.length);
  });

  it('GET /api/organizations lists organizations', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/organizations' });
    expect(response.statusCode).toBe(200);
    expect(response.json().length).toBeGreaterThan(0);
  });

  it('GET /api/tenants lists tenants', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/tenants' });
    expect(response.statusCode).toBe(200);
    expect(response.json().length).toBeGreaterThan(0);
  });

  it('PUT /api/tenants/:id/lifecycle suspends tenant', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/tenants/tenant-lateen-staging/lifecycle',
      payload: { action: 'suspend' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('suspended');
  });

  it('GET /api/billing lists invoices', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/billing' });
    expect(response.statusCode).toBe(200);
    expect(response.json().length).toBeGreaterThan(0);
  });

  it('GET /api/cloud/monitoring returns status', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/cloud/monitoring' });
    expect(response.statusCode).toBe(200);
    expect(response.json().length).toBeGreaterThan(0);
  });
});
