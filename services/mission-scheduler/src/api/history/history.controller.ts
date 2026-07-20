import { Controller, Get, Inject, Query, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { APP_CONFIG, HISTORY_SERVICE } from '../tokens';
import { resolveOrganizationId } from '../org-context';
import type { AppConfig } from '../../config/index';
import type { HistoryService } from '../../application/scheduler.services';

@Controller('api/history')
export class HistoryController {
  constructor(
    @Inject(HISTORY_SERVICE) private readonly history: HistoryService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get()
  list(@Req() req: FastifyRequest, @Query('missionId') missionId?: string) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.history.listHistory(organizationId, missionId);
  }
}
