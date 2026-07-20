import { Body, Controller, Get, Inject, NotFoundException, Param, Post, Query, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { APP_CONFIG, SYNC_SERVICE } from '../tokens';
import { resolveOrganizationId } from '../org-context';
import type { AppConfig } from '../../config/index';
import type { SyncService } from '../../application/integration.services';
import type { SyncDirection } from '../../domain/types';

@Controller('api/sync')
export class SyncController {
  constructor(
    @Inject(SYNC_SERVICE) private readonly sync: SyncService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get()
  listJobs(@Req() req: FastifyRequest, @Query('connectorId') connectorId?: string) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.sync.listSyncJobs(organizationId, connectorId);
  }

  @Post()
  startSync(
    @Body() body: { connectorId: string; direction: SyncDirection; schedule?: string },
    @Req() req: FastifyRequest,
  ) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.sync.startSync({ organizationId, ...body });
  }

  @Post(':jobId/run')
  async runJob(@Param('jobId') jobId: string, @Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    try {
      return await this.sync.runSyncJob(jobId, organizationId);
    } catch (error) {
      if (error instanceof Error && error.message === 'Sync job not found') {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
