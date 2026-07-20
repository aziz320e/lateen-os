import { serverEnv } from '@/lib/env';
import type { PlatformHealthSnapshot, ServiceHealth } from '@/types';

async function checkHttp(name: string, url: string, category: ServiceHealth['category']): Promise<ServiceHealth> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000), cache: 'no-store' });
    if (response.ok) return { name, url, status: 'ok', category };
    return { name, url, status: 'degraded', detail: `HTTP ${response.status}`, category };
  } catch (error) {
    return {
      name,
      url,
      status: 'down',
      detail: error instanceof Error ? error.message : 'unreachable',
      category,
    };
  }
}

export async function collectPlatformHealth(): Promise<PlatformHealthSnapshot> {
  const bds = serverEnv.NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL;
  const discovery = serverEnv.NEXT_PUBLIC_LATEEN_PRODUCT_DISCOVERY_BASE_URL;
  const identity = serverEnv.NEXT_PUBLIC_LATEEN_IDENTITY_BASE_URL;
  const aiPm = serverEnv.NEXT_PUBLIC_LATEEN_AI_PM_BASE_URL;
  const otel = serverEnv.LATEEN_OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, '');
  const nats = `http://localhost:${serverEnv.LATEEN_NATS_HOST_MONITORING_PORT}`;

  const services = await Promise.all([
    checkHttp('business-dna-service', `${bds}/health`, 'service'),
    checkHttp('product-discovery-service', `${discovery}/health`, 'service'),
    checkHttp('identity-service', `${identity}/health`, 'service'),
    checkHttp('ai-product-manager', `${aiPm}/api/dashboard`, 'service'),
    checkHttp('product-discovery-platform', `${discovery}/platform/health`, 'service'),
  ]);

  const infrastructure = await Promise.all([
    checkHttp('redis', `${discovery}/platform/health`, 'data'),
    checkHttp('postgresql', `${bds}/health`, 'data'),
    checkHttp('nats', `${nats}/healthz`, 'infrastructure'),
    checkHttp('otel-collector', `${otel}/`, 'infrastructure'),
    checkHttp('grafana', 'http://localhost:3000/api/health', 'infrastructure'),
    checkHttp('qdrant', 'http://localhost:6333/healthz', 'data'),
  ]);

  const all = [...services, ...infrastructure];
  const status = all.every((s) => s.status === 'ok') ? 'ok' : all.some((s) => s.status === 'down') ? 'down' : 'degraded';

  return { status, checkedAt: new Date().toISOString(), services: all };
}
