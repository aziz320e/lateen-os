import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import type { AppConfig } from '../../config/index.js';
import { GatewayIntegrationService } from '../../gateway/gateway-integration.service.js';
import { RuntimeRegistryService } from '../../runtime-registry/runtime-registry.service.js';
import { AuthenticationService } from '../../security/authentication.service.js';
import { AuthorizationService } from '../../security/authorization.service.js';
import { APP_CONFIG } from '../tokens.js';

// Not a liveness/readiness probe (those are GET /health and GET /version,
// documented in docs/release/BACKEND_ERP_WEB_OPERATIONS.md §2 and wired
// into Dockerfile.backend's real HEALTHCHECK) — this discloses
// environment name and service topology, so it requires an authenticated
// caller like every other non-probe route in this API.
@UseGuards(JwtAuthGuard)
@Controller()
export class PlatformController {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly registry: RuntimeRegistryService,
    private readonly gateway: GatewayIntegrationService,
    private readonly authentication: AuthenticationService,
    private readonly authorization: AuthorizationService,
  ) {}

  @Get('platform')
  async platform() {
    const statuses = this.registry.statuses();
    const services = await this.gateway.listRegisteredServices();
    return {
      platform: this.config.PLATFORM_NAME,
      environment: this.config.NODE_ENV,
      hostedEngines: statuses.filter((status) => status.hosted).length,
      runningEngines: statuses.filter((status) => status.status === 'running').length,
      registeredServices: services.length,
      integrations: {
        apiGateway: this.gateway.isAvailable(),
        authentication: this.authentication.isAvailable(),
        authorization: this.authorization.isAvailable(),
      },
    };
  }
}
