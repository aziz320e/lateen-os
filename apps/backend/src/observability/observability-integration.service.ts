/**
 * Observability integration — wires the real `observability-engine`
 * runtime (already constructed by the Runtime Registry) into the
 * platform host itself: every hosted engine's construction outcome is
 * recorded as a real `HealthCheck` via `observability.health`, and
 * `GET /health` (see `api/health/health.controller.ts`) reads it back
 * through the same real query layer — never a fabricated status.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { HealthCheck, ObservabilityRuntime } from '@lateen-os/observability-engine';
import { RuntimeRegistryService } from '../runtime-registry/runtime-registry.service.js';

/** Internal system identifier for platform-level (not tenant) observability records. This is not a real business organization. */
export const PLATFORM_ORGANIZATION_ID = 'platform-host';

@Injectable()
export class ObservabilityIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(ObservabilityIntegrationService.name);

  constructor(private readonly registry: RuntimeRegistryService) {}

  private runtime(): ObservabilityRuntime | undefined {
    return this.registry.get<ObservabilityRuntime>('observability-engine');
  }

  async onModuleInit(): Promise<void> {
    const observability = this.runtime();
    if (!observability) {
      this.logger.warn(
        'Observability Engine unavailable — platform host health checks will not be recorded.',
      );
      return;
    }
    for (const status of this.registry.statuses()) {
      if (!status.hosted) continue;
      await observability.health.checkComponentHealth(
        PLATFORM_ORGANIZATION_ID,
        status.name,
        status.status === 'running' ? 'healthy' : 'unhealthy',
        status.reason ? { reason: status.reason } : undefined,
      );
    }
  }

  async listComponentHealth(): Promise<readonly HealthCheck[]> {
    const observability = this.runtime();
    if (!observability) return [];
    return observability.health.list(PLATFORM_ORGANIZATION_ID);
  }
}
