import { Body, Controller, Inject, Param, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { APP_CONFIG, WEBHOOK_SERVICE } from '../tokens';
import { resolveOrganizationId } from '../org-context';
import type { AppConfig } from '../../config/index';
import type { WebhookService } from '../../webhooks/webhook.service';

@Controller('api/webhooks')
export class WebhooksController {
  constructor(
    @Inject(WEBHOOK_SERVICE) private readonly webhooks: WebhookService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Post()
  register(
    @Body() body: { connectorId: string; eventType: string; targetUrl: string; secretRef?: string },
    @Req() req: FastifyRequest,
  ) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.webhooks.register({ organizationId, ...body });
  }

  @Post('inbound/:connectorId')
  receive(
    @Param('connectorId') connectorId: string,
    @Body() body: Record<string, unknown>,
    @Req() req: FastifyRequest,
  ) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.webhooks.receiveInbound(connectorId, organizationId, body);
  }
}
