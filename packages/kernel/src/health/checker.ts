/** @module health/checker */
import type { KernelConfig } from '../configuration/schema.js';
import { PLATFORM_MANIFEST } from '../registry/manifest.js';
import type { HealthProbeResult, HealthStatus, PlatformHealthReport } from './types.js';

async function probe(
  name: string,
  url: string,
  kind: HealthProbeResult['kind'],
  timeoutMs: number,
): Promise<HealthProbeResult> {
  const started = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    const durationMs = Date.now() - started;
    if (response.ok) {
      return { name, kind, url, status: 'ok', durationMs };
    }
    return {
      name,
      kind,
      url,
      status: 'degraded',
      detail: `HTTP ${response.status}`,
      durationMs,
    };
  } catch (error) {
    return {
      name,
      kind,
      url,
      status: 'down',
      detail: error instanceof Error ? error.message : 'unreachable',
      durationMs: Date.now() - started,
    };
  }
}

function aggregateStatus(results: readonly HealthProbeResult[]): HealthStatus {
  if (results.every((result) => result.status === 'ok')) return 'ok';
  if (results.some((result) => result.status === 'down')) return 'down';
  return 'degraded';
}

export class HealthChecker {
  constructor(private readonly config: KernelConfig) {}

  async checkLiveness(host = 'localhost'): Promise<readonly HealthProbeResult[]> {
    const checks = PLATFORM_MANIFEST.services
      .filter((service) => service.healthPath)
      .map((service) =>
        probe(
          service.name,
          `http://${host}:${service.port}${service.healthPath}`,
          'liveness',
          this.config.healthCheckTimeoutMs,
        ),
      );

    return Promise.all(checks);
  }

  async checkReadiness(host = 'localhost'): Promise<readonly HealthProbeResult[]> {
    const checks = PLATFORM_MANIFEST.applications.map((app) =>
      probe(app.name, `http://${host}:${app.port}/`, 'readiness', this.config.healthCheckTimeoutMs),
    );

    return Promise.all(checks);
  }

  async checkDependencies(): Promise<readonly HealthProbeResult[]> {
    const env = process.env;
    const checks = [
      probe(
        'otel-collector',
        `${this.config.otlpEndpoint.replace(/\/$/, '')}/`,
        'dependency',
        this.config.healthCheckTimeoutMs,
      ),
      probe(
        'nats-monitoring',
        `http://localhost:${env.LATEEN_NATS_HOST_MONITORING_PORT ?? '8222'}/healthz`,
        'dependency',
        this.config.healthCheckTimeoutMs,
      ),
    ];

    return Promise.all(checks);
  }

  async collectReport(host = 'localhost'): Promise<PlatformHealthReport> {
    const [liveness, readiness, dependencies] = await Promise.all([
      this.checkLiveness(host),
      this.checkReadiness(host),
      this.checkDependencies(),
    ]);

    const all = [...liveness, ...readiness, ...dependencies];

    return {
      status: aggregateStatus(all),
      checkedAt: new Date().toISOString(),
      liveness,
      readiness,
      dependencies,
    };
  }
}

export function createHealthChecker(config: KernelConfig): HealthChecker {
  return new HealthChecker(config);
}
