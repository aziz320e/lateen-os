import { Controller, Get, Inject, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { APP_CONFIG, MONITORING_SERVICE, SCHEDULE_SERVICE } from '../tokens';
import { resolveOrganizationId } from '../org-context';
import type { AppConfig } from '../../config/index';
import type { MonitoringService, ScheduleService } from '../../application/scheduler.services';
import { MISSION_TYPE_CATALOG } from '../../mission/catalog';

@Controller('api/scheduler')
export class SchedulerController {
  constructor(
    @Inject(MONITORING_SERVICE) private readonly monitoring: MonitoringService,
    @Inject(SCHEDULE_SERVICE) private readonly schedules: ScheduleService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get()
  overview(@Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.monitoring.getSnapshot(organizationId);
  }

  @Get('types')
  missionTypes() {
    return MISSION_TYPE_CATALOG;
  }

  @Get('schedules')
  listSchedules(@Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.schedules.listSchedules(organizationId);
  }
}
