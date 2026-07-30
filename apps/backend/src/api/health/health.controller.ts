import { Controller, Get } from '@nestjs/common';
import { ObservabilityIntegrationService } from '../../observability/observability-integration.service.js';
import { RuntimeRegistryService } from '../../runtime-registry/runtime-registry.service.js';

@Controller()
export class HealthController {
  constructor(
    private readonly registry: RuntimeRegistryService,
    private readonly observability: ObservabilityIntegrationService,
  ) {}

  @Get('health')
  async health() {
    const statuses = this.registry.statuses();
    const hosted = statuses.filter((status) => status.hosted);
    const running = hosted.filter((status) => status.status === 'running').length;
    const checks = await this.observability.listComponentHealth();
    return {
      status: running === hosted.length ? 'healthy' : running > 0 ? 'degraded' : 'unhealthy',
      hostedEngines: hosted.length,
      runningEngines: running,
      componentHealthChecks: checks.length,
    };
  }
}
