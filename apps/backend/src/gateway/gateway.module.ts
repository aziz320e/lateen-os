import { Module } from '@nestjs/common';
import { RuntimeRegistryModule } from '../runtime-registry/runtime-registry.module.js';
import { GatewayIntegrationService } from './gateway-integration.service.js';

@Module({
  imports: [RuntimeRegistryModule],
  providers: [GatewayIntegrationService],
  exports: [GatewayIntegrationService],
})
export class GatewayModule {}
