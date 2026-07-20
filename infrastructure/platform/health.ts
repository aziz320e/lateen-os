/**
 * Unified platform health aggregation.
 */

export interface ServiceHealth {
  readonly name: string;
  readonly url: string;
  readonly status: 'ok' | 'degraded' | 'down';
  readonly detail?: string;
}

export interface PlatformHealth {
  readonly status: 'ok' | 'degraded' | 'down';
  readonly checkedAt: string;
  readonly services: readonly ServiceHealth[];
  readonly infrastructure: readonly ServiceHealth[];
}

async function checkHttp(name: string, url: string): Promise<ServiceHealth> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (response.ok) return { name, url, status: 'ok' };
    return { name, url, status: 'degraded', detail: `HTTP ${response.status}` };
  } catch (error) {
    return {
      name,
      url,
      status: 'down',
      detail: error instanceof Error ? error.message : 'unreachable',
    };
  }
}

export async function collectPlatformHealth(env: NodeJS.ProcessEnv = process.env): Promise<PlatformHealth> {
  const platform = {
    businessDnaBaseUrl: env.BUSINESS_DNA_BASE_URL ?? env.LATEEN_BUSINESS_DNA_BASE_URL ?? 'http://localhost:4001',
    productDiscoveryBaseUrl:
      env.PRODUCT_DISCOVERY_BASE_URL ?? env.LATEEN_PRODUCT_DISCOVERY_BASE_URL ?? 'http://localhost:4002',
    otelEndpoint: env.LATEEN_OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318',
    natsMonitoring: env.LATEEN_NATS_HOST_MONITORING_PORT
      ? `http://localhost:${env.LATEEN_NATS_HOST_MONITORING_PORT}`
      : 'http://localhost:8222',
  };

  const services = await Promise.all([
    checkHttp('business-dna-service', `${platform.businessDnaBaseUrl}/health`),
    checkHttp('product-discovery-service', `${platform.productDiscoveryBaseUrl}/health`),
    checkHttp('product-discovery-platform', `${platform.productDiscoveryBaseUrl}/platform/health`),
  ]);

  const infrastructure = await Promise.all([
    checkHttp('otel-collector', `${platform.otelEndpoint.replace(/\/$/, '')}/`),
    checkHttp('nats-monitoring', `${platform.natsMonitoring}/healthz`),
  ]);

  const all = [...services, ...infrastructure];
  const status = all.every((item) => item.status === 'ok')
    ? 'ok'
    : all.some((item) => item.status === 'down')
      ? 'down'
      : 'degraded';

  return {
    status,
    checkedAt: new Date().toISOString(),
    services,
    infrastructure,
  };
}
