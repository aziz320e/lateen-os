import { Body, Controller, Get, Inject, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { APP_CONFIG, CALENDAR_SERVICE } from '../tokens';
import { resolveOrganizationId } from '../org-context';
import type { AppConfig } from '../../config/index';
import type { CalendarService } from '../../application/scheduler.services';

@Controller('api/calendar')
export class CalendarController {
  constructor(
    @Inject(CALENDAR_SERVICE) private readonly calendar: CalendarService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get()
  list(@Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.calendar.listRules(organizationId);
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      timezone?: string;
      workingDays?: number[];
      startHour?: number;
      endHour?: number;
      holidays?: string[];
    },
    @Req() req: FastifyRequest,
  ) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.calendar.saveRule({
      organizationId,
      name: body.name,
      timezone: body.timezone ?? this.config.DEFAULT_TIMEZONE,
      workingDays: body.workingDays ?? [0, 1, 2, 3, 4],
      startHour: body.startHour ?? 8,
      endHour: body.endHour ?? 17,
      holidays: body.holidays ?? [],
      enabled: true,
    });
  }
}
