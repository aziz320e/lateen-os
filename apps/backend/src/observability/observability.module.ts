import { Module } from '@nestjs/common';
import { RuntimeRegistryModule } from '../runtime-registry/runtime-registry.module.js';
import { ObservabilityIntegrationService } from './observability-integration.service.js';

@Module({
  imports: [RuntimeRegistryModule],
  providers: [ObservabilityIntegrationService],
  exports: [ObservabilityIntegrationService],
})
export class ObservabilityModule {}
