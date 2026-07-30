/**
 * Analytics integration — wires the real `analytics-engine` runtime
 * (already constructed by the Runtime Registry) so the platform host
 * can record a real KPI snapshot for how many engines it is hosting.
 * This is platform self-observability, not a business metric — it uses
 * the same internal system identifier as the Observability integration.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { AnalyticsRuntime } from '@lateen-os/analytics-engine';
import { PLATFORM_ORGANIZATION_ID } from '../observability/observability-integration.service.js';
import { RuntimeRegistryService } from '../runtime-registry/runtime-registry.service.js';

@Injectable()
export class AnalyticsIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsIntegrationService.name);

  constructor(private readonly registry: RuntimeRegistryService) {}

  private runtime(): AnalyticsRuntime | undefined {
    return this.registry.get<AnalyticsRuntime>('analytics-engine');
  }

  async onModuleInit(): Promise<void> {
    const analytics = this.runtime();
    if (!analytics) {
      this.logger.warn(
        'Analytics Engine unavailable — platform host metrics will not be recorded.',
      );
      return;
    }
    const running = this.registry.statuses().filter((status) => status.status === 'running').length;
    await analytics.metrics.recordGauge(
      PLATFORM_ORGANIZATION_ID,
      'platform.engines_running',
      running,
    );
  }
}
