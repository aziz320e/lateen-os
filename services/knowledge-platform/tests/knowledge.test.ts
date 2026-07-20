import 'reflect-metadata';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from '../src/config/index';
import { AppModule } from '../src/app.module';
import { KnowledgeService } from '../src/application/knowledge.service';
import { InMemoryKnowledgeRepository } from '../src/repositories/in-memory-repository';
import { StubPipelineOrchestrator } from '../src/pipelines/pipeline-orchestrator';
import { InMemoryKnowledgeQueue } from '../src/workers/knowledge-queue';
import { InMemoryKnowledgeQueries } from '../src/queries/in-memory-queries';
import { PIPELINE_STEP_IDS, SUPPORTED_SOURCE_TYPES, KNOWLEDGE_TYPES } from '../src/domain/types';

function createTestApp() {
  const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'fatal', USE_REDIS: 'false' });
  const repo = new InMemoryKnowledgeRepository();
  const knowledgeService = new KnowledgeService(repo, new StubPipelineOrchestrator(), new InMemoryKnowledgeQueue());
  const knowledgeQueries = new InMemoryKnowledgeQueries(repo);
  return AppModule.register({ config, knowledgeService, knowledgeQueries });
}

describe('Knowledge Platform API', () => {
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
    expect(response.json()).toMatchObject({ status: 'ok', service: 'knowledge-platform' });
  });

  it('GET /api/pipeline returns 15 pipeline steps', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/pipeline' });
    expect(response.statusCode).toBe(200);
    expect(response.json().steps.length).toBe(PIPELINE_STEP_IDS.length);
  });

  it('GET /api/knowledge/types returns knowledge and source types', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/knowledge/types' });
    expect(response.statusCode).toBe(200);
    expect(response.json().knowledgeTypes.length).toBe(KNOWLEDGE_TYPES.length);
    expect(response.json().sourceTypes.length).toBe(SUPPORTED_SOURCE_TYPES.length);
  });

  it('POST /api/knowledge/import runs full pipeline', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/knowledge/import',
      payload: {
        organizationId: 'org-1',
        title: 'Security Policy',
        knowledgeType: 'policy',
        sourceType: 'pdf',
        mimeType: 'application/pdf',
        tags: ['security', 'compliance'],
        metadata: { department: 'Legal', classification: 'confidential' },
      },
    });
    expect(response.statusCode).toBe(201);
    const job = response.json();
    expect(job.status).toBe('completed');
    expect(job.steps.length).toBe(PIPELINE_STEP_IDS.length);
    expect(job.knowledgeId).toBeDefined();
  });

  it('GET /api/knowledge/status returns summary', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/knowledge/status' });
    expect(response.statusCode).toBe(200);
    expect(response.json().total).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/knowledge/search finds imported knowledge', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/knowledge/search?organizationId=org-1&q=Security',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().total).toBeGreaterThanOrEqual(1);
  });
});
