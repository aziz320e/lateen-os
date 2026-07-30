import { Module } from '@nestjs/common';
import { RuntimeRegistryModule } from '../runtime-registry/runtime-registry.module.js';
import { AnalyticsIntegrationService } from './analytics-integration.service.js';

@Module({
  imports: [RuntimeRegistryModule],
  providers: [AnalyticsIntegrationService],
  exports: [AnalyticsIntegrationService],
})
export class AnalyticsModule {}
