import 'reflect-metadata';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from '../src/config/index';
import { AppModule } from '../src/app.module';
import { createSearchService } from '../src/bootstrap/factory';
import { SEARCH_SOURCES, SEARCH_MODES } from '../src/domain/types';
import { detectIntent, selectSources } from '../src/ranking/ranker';

function createTestApp() {
  const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'fatal', USE_REDIS: 'false' });
  return AppModule.register({ config, searchService: createSearchService() });
}

describe('Search Platform API', () => {
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
    expect(response.json()).toMatchObject({ status: 'ok', service: 'search-platform' });
  });

  it('GET /api/search/modes returns modes and sources', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/search/modes' });
    expect(response.statusCode).toBe(200);
    expect(response.json().modes.length).toBe(SEARCH_MODES.length);
    expect(response.json().sources.length).toBe(SEARCH_SOURCES.length);
  });

  it('POST /api/search returns hybrid search results', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/search',
      payload: {
        query: 'security policy',
        mode: 'hybrid',
        filters: { organizationId: 'org-1' },
        userId: 'user-1',
      },
    });
    expect(response.statusCode).toBe(201);
    const result = response.json();
    expect(result.total).toBeGreaterThan(0);
    expect(result.hits.length).toBeGreaterThan(0);
    expect(result.intent).toBeDefined();
    expect(result.sourcesQueried.length).toBeGreaterThan(0);
  });

  it('GET /api/search/recent returns recent searches', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/search/recent?organizationId=org-1&userId=user-1',
    });
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json())).toBe(true);
  });

  it('GET /api/search/indexes returns index registry', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/search/indexes' });
    expect(response.statusCode).toBe(200);
    expect(response.json().length).toBe(SEARCH_SOURCES.length);
  });
});

describe('Search ranking', () => {
  it('detects marketplace intent', () => {
    expect(detectIntent('marketplace stripe', 'keyword')).toBe('marketplace-browse');
  });

  it('selects sources by intent', () => {
    const sources = selectSources('document-find');
    expect(sources).toContain('knowledge-platform');
    expect(sources).toContain('documents');
  });
});
