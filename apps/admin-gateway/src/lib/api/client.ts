export interface GatewayRoute {
  id: string;
  displayName: string;
  gatewayPrefix: string;
  serviceName: string;
  version: string;
  status: 'active' | 'planned';
  authRequired: boolean;
  cacheable: boolean;
}

export interface GatewayStatus {
  service: string;
  version: string;
  uptimeSeconds: number;
  routes: { total: number; active: number; planned: number };
  metrics: {
    totalRequests: number;
    proxyErrors: number;
    rateLimited: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

export interface DependencyHealth {
  service: string;
  status: 'healthy' | 'unhealthy' | 'planned' | 'unknown';
  latencyMs?: number;
  message?: string;
}

export async function fetchRoutes(): Promise<GatewayRoute[]> {
  const response = await fetch('/api/gateway/routes');
  if (!response.ok) throw new Error('Failed to load routes');
  const data = (await response.json()) as { routes: GatewayRoute[] };
  return data.routes;
}

export async function fetchStatus(): Promise<GatewayStatus> {
  const response = await fetch('/api/gateway/status');
  if (!response.ok) throw new Error('Failed to load status');
  return response.json() as Promise<GatewayStatus>;
}

export async function fetchDependencies(): Promise<DependencyHealth[]> {
  const response = await fetch('/api/gateway/health');
  if (!response.ok) throw new Error('Failed to load dependencies');
  const data = (await response.json()) as { dependencies: DependencyHealth[] };
  return data.dependencies;
}
