import { Body, Controller, Get, Inject, Param, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { APP_CONFIG, EVENT_LISTENER_SERVICE, TRIGGER_SERVICE } from '../tokens';
import { resolveOrganizationId } from '../org-context';
import type { AppConfig } from '../../config/index';
import type { TriggerService } from '../../application/scheduler.services';
import type { EventListenerService } from '../../event-listener/event-listener.service';
import type { MissionSource, MissionTypeCode, TriggerType } from '../../domain/types';

@Controller('api/triggers')
export class TriggersController {
  constructor(
    @Inject(TRIGGER_SERVICE) private readonly triggers: TriggerService,
    @Inject(EVENT_LISTENER_SERVICE) private readonly listener: EventListenerService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get()
  list(@Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.triggers.listTriggers(organizationId);
  }

  @Post()
  register(
    @Body()
    body: {
      type: TriggerType;
      source: MissionSource;
      missionType: MissionTypeCode;
      config?: Record<string, unknown>;
    },
    @Req() req: FastifyRequest,
  ) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.triggers.registerTrigger({ organizationId, ...body });
  }

  @Post(':id/fire')
  fire(@Param('id') id: string, @Body() body: Record<string, unknown>, @Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.triggers.fireTrigger(id, organizationId, body);
  }

  @Post('events/ingest')
  ingest(
    @Body() body: { eventName: string; payload?: Record<string, unknown> },
    @Req() req: FastifyRequest,
  ) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.listener.ingestEvent({
      eventName: body.eventName,
      organizationId,
      payload: body.payload ?? {},
    });
  }
}
