import 'reflect-metadata';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from '../src/config/index';
import { AppModule, createGatewayServices } from '../src/app.module';

function createTestApp() {
  const config = loadConfig({
    NODE_ENV: 'test',
    LOG_LEVEL: 'fatal',
    USE_REDIS: 'false',
    USE_NATS: 'false',
  });
  const services = createGatewayServices(config);
  return {
    module: AppModule.register({
      config,
      proxyService: services.proxyService,
      healthAggregator: services.healthAggregator,
      metricsService: services.metrics,
      routes: services.routes,
    }),
  };
}

describe('API Gateway', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const { module } = createTestApp();
    app = await NestFactory.create(module, new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', service: 'api-gateway' });
  });

  it('GET /health/live returns alive', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/live' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'alive' });
  });

  it('GET /gateway/routes lists routes', async () => {
    const response = await app.inject({ method: 'GET', url: '/gateway/routes' });
    expect(response.statusCode).toBe(200);
    expect(response.json().routes.length).toBe(13);
  });

  it('GET /gateway/status returns gateway status', async () => {
    const response = await app.inject({ method: 'GET', url: '/gateway/status' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      service: 'api-gateway',
      routes: { total: 13, active: 10, planned: 3 },
    });
  });

  it('GET /api/platform returns platform manifest summary', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/platform' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ name: 'Lateen OS API Gateway', architecture: 'v1.0' });
  });

  it('GET /api/runtime returns planned service response', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/runtime',
      headers: { authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyLTEifQ.c2ln' },
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: 'planned', route: 'runtime' });
  });

  it('GET /api/business-dna without auth returns 401', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/business-dna/organizations' });
    expect(response.statusCode).toBe(401);
  });

  it('GET /openapi.json returns OpenAPI document', async () => {
    const response = await app.inject({ method: 'GET', url: '/openapi.json' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ openapi: '3.1.0' });
  });

  it('GET /metrics returns prometheus metrics', async () => {
    await app.inject({ method: 'GET', url: '/api/platform' });
    const response = await app.inject({ method: 'GET', url: '/metrics' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('lateen_gateway_requests_total');
  });
});
