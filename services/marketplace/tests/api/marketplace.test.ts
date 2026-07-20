import 'reflect-metadata';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from '../../src/config/index';
import { AppModule } from '../../src/app.module';
import { createInMemoryRepositories } from '../../src/repositories/marketplace-repositories';
import {
  ExtensionService,
  InstallService,
  PublishService,
  PublisherService,
  ReleaseService,
  ReviewService,
  SearchService,
} from '../../src/application/marketplace.services';

const ORG_A = '00000000-0000-4000-8000-000000000001';

function createTestApp() {
  const config = loadConfig({
    NODE_ENV: 'test',
    LOG_LEVEL: 'fatal',
    USE_REDIS: 'false',
  });

  const repos = createInMemoryRepositories(true);
  return AppModule.register({
    config,
    publisherService: new PublisherService(repos),
    extensionService: new ExtensionService(repos),
    searchService: new SearchService(repos),
    releaseService: new ReleaseService(repos),
    publishService: new PublishService(repos),
    installService: new InstallService(repos),
    reviewService: new ReviewService(repos),
  });
}

describe('Marketplace API', () => {
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
    expect(response.json()).toMatchObject({ status: 'ok', service: 'marketplace' });
  });

  it('GET /api/extensions returns seed catalog', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/extensions' });
    expect(response.statusCode).toBe(200);
    expect(response.json().length).toBeGreaterThanOrEqual(3);
  });

  it('GET /api/publishers returns publishers', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/publishers' });
    expect(response.statusCode).toBe(200);
    expect(response.json().length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/search finds stripe connector', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/search?q=stripe' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.extensions[0].extensionId).toBe('stripe-connector');
  });

  it('GET /api/releases returns releases for extension', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/releases?extensionId=stripe-connector',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/install installs extension', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/install',
      headers: { 'x-organization-id': ORG_A },
      payload: { extensionId: 'stripe-connector', approvePermissions: ['integration:read', 'integration:write'] },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.installation.status).toBe('installed');
    expect(body.release.version).toBe('1.0.0');
  });

  it('POST /api/reviews/:extensionId creates review', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/reviews/stripe-connector',
      headers: { 'x-organization-id': ORG_A },
      payload: { rating: 5, comment: 'Works great', authorId: 'user-1', verifiedInstall: true },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().rating).toBe(5);
  });

  it('POST /api/releases/publish publishes new release', async () => {
    const publishers = await app.inject({ method: 'GET', url: '/api/publishers' });
    const publisherId = publishers.json()[0].id;

    const response = await app.inject({
      method: 'POST',
      url: '/api/releases/publish',
      payload: {
        publisherId,
        manifest: {
          id: 'demo-widget',
          name: 'demo-widget',
          displayName: 'Demo Widget',
          version: '1.0.0',
          author: 'Lateen OS',
          license: 'MIT',
          description: 'Demo marketplace widget',
          category: 'ui',
          type: 'widget',
          engineVersion: '1.0.0',
          sdkVersion: '1.0.0',
          permissions: [],
          dependencies: [],
        },
        releaseNotes: 'Initial publish',
      },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().extension.extensionId).toBe('demo-widget');
  });
});
