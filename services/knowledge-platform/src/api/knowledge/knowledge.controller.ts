import { Controller, Get, Inject, Param, Post, Body, Query } from '@nestjs/common';
import { KNOWLEDGE_QUERIES, KNOWLEDGE_SERVICE } from '../tokens';
import type { KnowledgeService } from '../../application/knowledge.service';
import type { KnowledgeQueries } from '../../queries/knowledge-queries';
import { KNOWLEDGE_TYPES, SUPPORTED_SOURCE_TYPES } from '../../domain/types';

@Controller('api/knowledge')
export class KnowledgeController {
  constructor(@Inject(KNOWLEDGE_SERVICE) private readonly knowledgeService: KnowledgeService) {}

  @Post('import')
  async importDocument(@Body() body: Record<string, unknown>) {
    const job = await this.knowledgeService.importKnowledge({
      organizationId: String(body.organizationId),
      title: String(body.title),
      knowledgeType: body.knowledgeType as ImportBody['knowledgeType'],
      sourceType: body.sourceType as ImportBody['sourceType'],
      sourceUri: body.sourceUri ? String(body.sourceUri) : undefined,
      mimeType: body.mimeType ? String(body.mimeType) : undefined,
      contentBase64: body.contentBase64 ? String(body.contentBase64) : undefined,
      tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
      metadata: body.metadata as ImportBody['metadata'],
    });
    return job;
  }

  @Get('status')
  status() {
    return this.knowledgeService.getStatus();
  }

  @Get('types')
  types() {
    return { knowledgeTypes: KNOWLEDGE_TYPES, sourceTypes: SUPPORTED_SOURCE_TYPES };
  }

  @Get('documents/:id')
  async getDocument(@Param('id') id: string, @Query('organizationId') organizationId: string) {
    const doc = await this.knowledgeService.getDocument(id, organizationId);
    if (!doc) return { error: 'Not found' };
    return doc;
  }

  @Get(':id')
  async getJob(@Param('id') id: string) {
    const job = await this.knowledgeService.getJob(id);
    if (!job) return { error: 'Not found' };
    return job;
  }
}

type ImportBody = Parameters<KnowledgeService['importKnowledge']>[0];

@Controller('api/knowledge/search')
export class KnowledgeSearchController {
  constructor(@Inject(KNOWLEDGE_QUERIES) private readonly queries: KnowledgeQueries) {}

  @Get()
  async search(
    @Query('organizationId') organizationId: string,
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    return this.queries.findKnowledge({ organizationId, query: q ?? '', limit: limit ? Number(limit) : 20 });
  }

  @Get('recent')
  recent(@Query('organizationId') organizationId: string, @Query('limit') limit?: string) {
    return this.queries.findRecentKnowledge({ organizationId, limit: limit ? Number(limit) : 20 });
  }

  @Get('department')
  byDepartment(
    @Query('organizationId') organizationId: string,
    @Query('department') department: string,
  ) {
    return this.queries.findByDepartment({ organizationId, department });
  }

  @Get('tags')
  byTags(
    @Query('organizationId') organizationId: string,
    @Query('tags') tags: string,
  ) {
    return this.queries.findByTags({ organizationId, tags: tags.split(',') });
  }
}
