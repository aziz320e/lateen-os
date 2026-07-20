import 'reflect-metadata';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from '../src/config/index';
import { AppModule } from '../src/app.module';
import { createAnalyticsService } from '../src/bootstrap/factory';
import { ANALYTICS_DOMAINS, DASHBOARD_IDS, METRIC_IDS, PIPELINE_STEPS } from '../src/domain/types';

function createTestApp() {
  const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'fatal', USE_REDIS: 'false' });
  return AppModule.register({ config, analyticsService: createAnalyticsService() });
}

describe('Analytics Platform API', () => {
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
    expect(response.json()).toMatchObject({ status: 'ok', service: 'analytics-platform' });
  });

  it('GET /api/analytics/domains returns domains and metrics', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/analytics/domains' });
    expect(response.statusCode).toBe(200);
    expect(response.json().domains.length).toBe(ANALYTICS_DOMAINS.length);
    expect(response.json().metrics.length).toBe(METRIC_IDS.length);
  });

  it('GET /api/analytics/pipeline returns 7 steps', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/analytics/pipeline' });
    expect(response.statusCode).toBe(200);
    expect(response.json().steps.length).toBe(PIPELINE_STEPS.length);
  });

  it('POST /api/analytics runs pipeline', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/analytics',
      payload: { organizationId: 'org-1', dashboardId: 'ceo' },
    });
    expect(response.statusCode).toBe(201);
    const result = response.json();
    expect(result.steps.length).toBe(7);
    expect(result.dashboard).toBeDefined();
    expect(result.metrics.length).toBeGreaterThan(0);
  });

  it('GET /api/dashboard/ceo returns CEO dashboard', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/dashboard/ceo?organizationId=org-1' });
    expect(response.statusCode).toBe(200);
    expect(response.json().id).toBe('ceo');
    expect(response.json().kpis.length).toBeGreaterThan(0);
  });

  it('GET /api/dashboard lists all dashboards', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/dashboard' });
    expect(response.statusCode).toBe(200);
    expect(response.json().length).toBe(DASHBOARD_IDS.length);
  });

  it('GET /api/alerts returns alert definitions', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/alerts' });
    expect(response.statusCode).toBe(200);
    expect(response.json().length).toBeGreaterThan(0);
  });
});
