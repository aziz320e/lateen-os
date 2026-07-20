import { Body, Controller, Inject, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { APP_CONFIG, INSTALL_SERVICE } from '../tokens';
import { resolveOrganizationId } from '../org-context';
import type { AppConfig } from '../../config/index';
import type { InstallService } from '../../application/marketplace.services';
import type { InstallRequest } from '../../domain/types';

@Controller('api/install')
export class InstallController {
  constructor(
    @Inject(INSTALL_SERVICE) private readonly install: InstallService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Post()
  installExtension(@Body() body: Omit<InstallRequest, 'organizationId'>, @Req() req: FastifyRequest) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.install.install({ ...body, organizationId });
  }
}
