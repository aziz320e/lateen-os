import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import {
  APP_CONFIG,
  EXECUTION_SERVICE,
  SCHEDULER_SERVICE,
} from '../tokens';
import { resolveOrganizationId } from '../org-context';
import type { AppConfig } from '../../config/index';
import type { ExecutionService, MissionSchedulerService } from '../../application/scheduler.services';
import type { MissionSource, MissionTypeCode, ScheduleMode } from '../../domain/types';

@Controller('api/missions')
export class MissionsController {
  constructor(
    @Inject(SCHEDULER_SERVICE) private readonly scheduler: MissionSchedulerService,
    @Inject(EXECUTION_SERVICE) private readonly execution: ExecutionService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get()
  list(@Req() req: FastifyRequest, @Query('status') status?: string) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.scheduler.listMissions(organizationId, status as never);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    const mission = await this.scheduler.getMission(id, organizationId);
    if (!mission) throw new NotFoundException('Mission not found');
    return mission;
  }

  @Post()
  schedule(
    @Body()
    body: {
      missionType: MissionTypeCode;
      source?: MissionSource;
      mode?: ScheduleMode;
      scheduledAt?: string;
      priority?: string;
      payload?: Record<string, unknown>;
    },
    @Req() req: FastifyRequest,
  ) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.scheduler.scheduleMission({
      organizationId,
      missionType: body.missionType,
      source: body.source ?? 'MANUAL',
      mode: body.mode ?? 'IMMEDIATE',
      scheduledAt: body.scheduledAt,
      priority: (body.priority as never) ?? 'NORMAL',
      payload: body.payload,
    });
  }

  @Post(':id/execute')
  execute(@Param('id') id: string, @Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.execution.executeMission(id, organizationId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.scheduler.cancelMission(id, organizationId);
  }

  @Post(':id/retry')
  retry(@Param('id') id: string, @Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.scheduler.retryMission(id, organizationId);
  }
}
