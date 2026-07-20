import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CONNECTOR_SERVICE, MONITORING_SERVICE } from '../tokens';
import { resolveOrganizationId } from '../org-context';
import type { AppConfig } from '../../config/index';
import { APP_CONFIG } from '../tokens';
import type { ConnectorService } from '../../application/integration.services';
import type { MonitoringService } from '../../application/integration.services';
import type { ConnectorConfiguration, ConnectorLifecycleAction } from '../../domain/types';

@Controller('api/connectors')
export class ConnectorsController {
  constructor(
    @Inject(CONNECTOR_SERVICE) private readonly connectors: ConnectorService,
    @Inject(MONITORING_SERVICE) private readonly monitoring: MonitoringService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get('definitions')
  listDefinitions() {
    return this.connectors.listDefinitions();
  }

  @Get()
  listConnectors(@Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.connectors.listConnectors(organizationId);
  }

  @Get('monitoring/snapshot')
  async monitoringSnapshot(@Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.monitoring.getSnapshot(organizationId);
  }

  @Get(':id')
  async getConnector(@Param('id') id: string, @Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    const connector = await this.connectors.getConnector(id, organizationId);
    if (!connector) throw new NotFoundException('Connector not found');
    return connector;
  }

  @Get(':id/health')
  async getHealth(@Param('id') id: string, @Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.connectors.getHealth(id, organizationId);
  }

  @Post()
  install(
    @Body() body: { definitionCode: string; configuration?: ConnectorConfiguration },
    @Req() req: FastifyRequest,
  ) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.connectors.executeLifecycle('install', {
      organizationId,
      definitionCode: body.definitionCode,
      configuration: body.configuration,
    });
  }

  @Post(':id/lifecycle')
  lifecycle(
    @Param('id') id: string,
    @Body() body: { action: ConnectorLifecycleAction; configuration?: ConnectorConfiguration },
    @Req() req: FastifyRequest,
  ) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.connectors.executeLifecycle(body.action, {
      organizationId,
      definitionCode: '',
      connectorId: id,
      configuration: body.configuration,
    });
  }

}
