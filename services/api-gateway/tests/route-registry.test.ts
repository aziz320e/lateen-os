import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/index';
import {
  buildRouteRegistry,
  buildTargetUrl,
  resolveRoute,
  listUniqueServices,
} from '../src/domain/route-registry';

describe('route registry', () => {
  const config = loadConfig({ NODE_ENV: 'test' });
  const routes = buildRouteRegistry(config);

  it('registers all gateway API prefixes', () => {
    const prefixes = routes.map((route) => route.gatewayPrefix);
    expect(prefixes).toContain('/api/auth');
    expect(prefixes).toContain('/api/business-dna');
    expect(prefixes).toContain('/api/discovery');
    expect(prefixes).toContain('/api/workflows');
    expect(prefixes).toContain('/api/missions');
    expect(prefixes).toContain('/api/runtime');
    expect(prefixes).toContain('/api/workforce');
    expect(prefixes).toContain('/api/memory');
    expect(prefixes).toContain('/api/search');
    expect(prefixes).toContain('/api/marketplace');
    expect(prefixes).toContain('/api/connectors');
    expect(prefixes).toContain('/api/provisioning');
    expect(prefixes).toContain('/api/platform');
  });

  it('rewrites auth paths to identity service', () => {
    const route = resolveRoute(routes, '/api/auth/login')!;
    expect(route.serviceName).toBe('identity-service');
    expect(buildTargetUrl(route, '/api/auth/login')).toBe(`${config.IDENTITY_BASE_URL}/api/v1/auth/login`);
  });

  it('rewrites business-dna paths', () => {
    const route = resolveRoute(routes, '/api/business-dna/organizations/org-1/products')!;
    expect(buildTargetUrl(route, '/api/business-dna/organizations/org-1/products')).toBe(
      `${config.BUSINESS_DNA_BASE_URL}/api/v1/organizations/org-1/products`,
    );
  });

  it('marks future services as planned', () => {
    const runtime = routes.find((route) => route.id === 'runtime');
    expect(runtime?.status).toBe('planned');
  });

  it('lists unique active downstream services', () => {
    const services = listUniqueServices(routes);
    expect(services.map((s) => s.serviceName)).toEqual(
      expect.arrayContaining(['identity-service', 'business-dna-service', 'marketplace']),
    );
  });
});
