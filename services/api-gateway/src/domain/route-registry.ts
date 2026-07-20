import type { AppConfig } from '../config/index';
import type { GatewayRouteDefinition } from './types';

export function buildRouteRegistry(config: AppConfig): readonly GatewayRouteDefinition[] {
  return [
    {
      id: 'auth',
      displayName: 'Authentication',
      gatewayPrefix: '/api/auth',
      serviceName: 'identity-service',
      targetBaseUrl: config.IDENTITY_BASE_URL,
      targetPathPrefix: '/api/v1/auth',
      healthPath: '/health',
      version: 'v1',
      status: 'active',
      authRequired: false,
      cacheable: false,
    },
    {
      id: 'business-dna',
      displayName: 'Business DNA',
      gatewayPrefix: '/api/business-dna',
      serviceName: 'business-dna-service',
      targetBaseUrl: config.BUSINESS_DNA_BASE_URL,
      targetPathPrefix: '/api/v1',
      healthPath: '/health',
      version: 'v1',
      status: 'active',
      authRequired: true,
      cacheable: true,
    },
    {
      id: 'discovery',
      displayName: 'Product Discovery',
      gatewayPrefix: '/api/discovery',
      serviceName: 'product-discovery',
      targetBaseUrl: config.PRODUCT_DISCOVERY_BASE_URL,
      targetPathPrefix: '/api/v1/discovery',
      healthPath: '/health',
      version: 'v1',
      status: 'active',
      authRequired: true,
      cacheable: false,
    },
    {
      id: 'workflows',
      displayName: 'Workflows',
      gatewayPrefix: '/api/workflows',
      serviceName: 'integration-hub',
      targetBaseUrl: config.INTEGRATION_HUB_BASE_URL,
      targetPathPrefix: '/api/jobs',
      healthPath: '/health',
      version: 'v1',
      status: 'active',
      authRequired: true,
      cacheable: false,
    },
    {
      id: 'missions',
      displayName: 'Mission Scheduler',
      gatewayPrefix: '/api/missions',
      serviceName: 'mission-scheduler',
      targetBaseUrl: config.MISSION_SCHEDULER_BASE_URL,
      targetPathPrefix: '/api/missions',
      healthPath: '/health',
      version: 'v1',
      status: 'active',
      authRequired: true,
      cacheable: false,
    },
    {
      id: 'runtime',
      displayName: 'Runtime',
      gatewayPrefix: '/api/runtime',
      serviceName: 'runtime',
      targetBaseUrl: '',
      targetPathPrefix: '',
      healthPath: '/health',
      version: 'v1',
      status: 'planned',
      authRequired: true,
      cacheable: false,
    },
    {
      id: 'workforce',
      displayName: 'Workforce',
      gatewayPrefix: '/api/workforce',
      serviceName: 'workforce',
      targetBaseUrl: '',
      targetPathPrefix: '',
      healthPath: '/health',
      version: 'v1',
      status: 'planned',
      authRequired: true,
      cacheable: false,
    },
    {
      id: 'memory',
      displayName: 'Memory',
      gatewayPrefix: '/api/memory',
      serviceName: 'memory',
      targetBaseUrl: '',
      targetPathPrefix: '',
      healthPath: '/health',
      version: 'v1',
      status: 'planned',
      authRequired: true,
      cacheable: false,
    },
    {
      id: 'search',
      displayName: 'Search',
      gatewayPrefix: '/api/search',
      serviceName: 'marketplace',
      targetBaseUrl: config.MARKETPLACE_BASE_URL,
      targetPathPrefix: '/api/search',
      healthPath: '/health',
      version: 'v1',
      status: 'active',
      authRequired: true,
      cacheable: true,
    },
    {
      id: 'marketplace',
      displayName: 'Marketplace',
      gatewayPrefix: '/api/marketplace',
      serviceName: 'marketplace',
      targetBaseUrl: config.MARKETPLACE_BASE_URL,
      targetPathPrefix: '/api',
      healthPath: '/health',
      version: 'v1',
      status: 'active',
      authRequired: true,
      cacheable: true,
    },
    {
      id: 'connectors',
      displayName: 'Connectors',
      gatewayPrefix: '/api/connectors',
      serviceName: 'integration-hub',
      targetBaseUrl: config.INTEGRATION_HUB_BASE_URL,
      targetPathPrefix: '/api/connectors',
      healthPath: '/health',
      version: 'v1',
      status: 'active',
      authRequired: true,
      cacheable: false,
    },
    {
      id: 'provisioning',
      displayName: 'Provisioning',
      gatewayPrefix: '/api/provisioning',
      serviceName: 'provisioning',
      targetBaseUrl: config.PROVISIONING_BASE_URL,
      targetPathPrefix: '/api',
      healthPath: '/health',
      version: 'v1',
      status: 'active',
      authRequired: true,
      cacheable: false,
    },
    {
      id: 'platform',
      displayName: 'Platform',
      gatewayPrefix: '/api/platform',
      serviceName: 'api-gateway',
      targetBaseUrl: '',
      targetPathPrefix: '',
      healthPath: '/health',
      version: 'v1',
      status: 'active',
      authRequired: false,
      cacheable: false,
    },
  ];
}

export function resolveRoute(
  routes: readonly GatewayRouteDefinition[],
  path: string,
): GatewayRouteDefinition | undefined {
  const normalized = path.split('?')[0] ?? path;
  const matches = routes
    .filter((route) => normalized === route.gatewayPrefix || normalized.startsWith(`${route.gatewayPrefix}/`))
    .sort((a, b) => b.gatewayPrefix.length - a.gatewayPrefix.length);
  return matches[0];
}

export function buildTargetUrl(route: GatewayRouteDefinition, requestPath: string): string {
  const suffix = requestPath.slice(route.gatewayPrefix.length);
  return `${route.targetBaseUrl}${route.targetPathPrefix}${suffix}`;
}

export function listUniqueServices(routes: readonly GatewayRouteDefinition[]): readonly GatewayRouteDefinition[] {
  const seen = new Set<string>();
  const result: GatewayRouteDefinition[] = [];
  for (const route of routes) {
    if (route.status !== 'active' || !route.targetBaseUrl) continue;
    if (seen.has(route.serviceName)) continue;
    seen.add(route.serviceName);
    result.push(route);
  }
  return result;
}
