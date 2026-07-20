import { Controller, Get } from '@nestjs/common';
import { HEALTH_AGGREGATOR, PROXY_SERVICE } from '../tokens';
import { Inject } from '@nestjs/common';
import type { HealthAggregatorService } from '../../application/health-aggregator.service';
import type { ProxyService } from '../../application/proxy.service';

@Controller()
export class HealthController {
  constructor(
    @Inject(HEALTH_AGGREGATOR) private readonly healthAggregator: HealthAggregatorService,
    @Inject(PROXY_SERVICE) private readonly proxyService: ProxyService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'api-gateway', uptimeSeconds: this.proxyService.getUptimeSeconds() };
  }

  @Get('health/live')
  liveness() {
    return { status: 'alive', service: 'api-gateway' };
  }

  @Get('health/ready')
  async readiness() {
    const dependencies = await this.healthAggregator.checkDependencies();
    const ready = this.healthAggregator.isReady(dependencies);
    return {
      status: ready ? 'ready' : 'not_ready',
      service: 'api-gateway',
      dependencies,
    };
  }

  @Get('health/dependencies')
  async dependencies() {
    const dependencies = await this.healthAggregator.checkDependencies();
    return { dependencies };
  }
}
