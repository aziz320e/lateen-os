/**
 * API Gateway integration — the platform host registers every hosted
 * engine as a real, discoverable service through `packages/api-gateway`'s
 * own `discovery` engine (`ServiceDiscoveryEngine.registerService()` /
 * `markAvailable()`), and its runtime construction already had every
 * other hosted engine's real sibling slice injected (see
 * `runtime-registry.service.ts`) — this is Service Registry and Runtime
 * Discovery satisfied by the platform's own existing engine, not a
 * parallel reimplementation.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ApiGatewayRuntime, ServiceRegistration } from '@lateen-os/api-gateway';
import { PLATFORM_ORGANIZATION_ID } from '../observability/observability-integration.service.js';
import { RuntimeRegistryService } from '../runtime-registry/runtime-registry.service.js';

@Injectable()
export class GatewayIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(GatewayIntegrationService.name);

  constructor(private readonly registry: RuntimeRegistryService) {}

  private runtime(): ApiGatewayRuntime | undefined {
    return this.registry.get<ApiGatewayRuntime>('api-gateway');
  }

  isAvailable(): boolean {
    return this.runtime() !== undefined;
  }

  async onModuleInit(): Promise<void> {
    const gateway = this.runtime();
    if (!gateway) {
      this.logger.warn(
        'API Gateway Engine unavailable — hosted engines will not be registered as discoverable services.',
      );
      return;
    }
    for (const status of this.registry.statuses()) {
      if (status.status !== 'running') continue;
      await gateway.discovery.registerService(PLATFORM_ORGANIZATION_ID, status.name);
      await gateway.discovery.markAvailable(PLATFORM_ORGANIZATION_ID, status.name);
    }
    this.logger.log('Hosted engines registered with the API Gateway service registry.');
  }

  async listRegisteredServices(): Promise<readonly ServiceRegistration[]> {
    const gateway = this.runtime();
    if (!gateway) return [];
    return gateway.discovery.list(PLATFORM_ORGANIZATION_ID);
  }
}
