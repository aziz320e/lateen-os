import { describe, expect, it } from 'vitest';
import { createGatewayEventBus } from '../src/events/index.js';
import { canTransitionApi, canTransitionApiVersion, createRegistryEngine } from '../src/registry/engine.impl.js';
import { createApiRepository, createApiVersionRepository, createEndpointRepository, createRouteRepository } from '../src/registry/repository.impl.js';
import {
  ApiNotFoundError,
  ApiVersionNotFoundError,
  DuplicateRouteError,
  EndpointNotFoundError,
  InvalidApiTransitionError,
  InvalidApiVersionTransitionError,
} from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createGatewayEventBus();
  const engine = createRegistryEngine(createApiRepository(), createApiVersionRepository(), createEndpointRepository(), createRouteRepository(), eventBus);
  return { engine, eventBus };
}

describe('canTransitionApi (pure)', () => {
  it('active -> deprecated | retired', () => {
    expect(canTransitionApi('active', 'deprecated')).toBe(true);
    expect(canTransitionApi('active', 'retired')).toBe(true);
  });

  it('deprecated -> retired | active', () => {
    expect(canTransitionApi('deprecated', 'retired')).toBe(true);
    expect(canTransitionApi('deprecated', 'active')).toBe(true);
  });

  it('retired is terminal', () => {
    expect(canTransitionApi('retired', 'active')).toBe(false);
  });
});

describe('canTransitionApiVersion (pure)', () => {
  it('draft -> published -> deprecated -> retired', () => {
    expect(canTransitionApiVersion('draft', 'published')).toBe(true);
    expect(canTransitionApiVersion('published', 'deprecated')).toBe(true);
    expect(canTransitionApiVersion('deprecated', 'retired')).toBe(true);
    expect(canTransitionApiVersion('retired', 'draft')).toBe(false);
  });

  it('draft cannot skip straight to deprecated', () => {
    expect(canTransitionApiVersion('draft', 'deprecated')).toBe(false);
  });
});

describe('RegistryEngine — API Registry', () => {
  it('registerApi() starts at active status', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    expect(api.status).toBe('active');
  });

  it('publishes api.registered', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('api.registered', (payload) => (seen = payload));
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    expect(seen).toEqual({ organizationId: ORG, apiId: api.id, code: 'CRM' });
  });

  it('deprecateApi() -> reactivateApi() -> retireApi() progresses the lifecycle', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const deprecated = await engine.deprecateApi(ORG, api.id);
    expect(deprecated.status).toBe('deprecated');
    const reactivated = await engine.reactivateApi(ORG, api.id);
    expect(reactivated.status).toBe('active');
    const retired = await engine.retireApi(ORG, api.id);
    expect(retired.status).toBe('retired');
  });

  it('rejects retireApi() called twice', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    await engine.retireApi(ORG, api.id);
    await expect(engine.retireApi(ORG, api.id)).rejects.toBeInstanceOf(InvalidApiTransitionError);
  });

  it('deprecateApi() throws ApiNotFoundError for an unknown api', async () => {
    const { engine } = setup();
    await expect(engine.deprecateApi(ORG, 'missing')).rejects.toBeInstanceOf(ApiNotFoundError);
  });

  it('findApiByCode() finds by code, get()/list() work as expected', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    expect(await engine.findApiByCode(ORG, 'CRM')).toEqual(api);
    expect(await engine.getApi(ORG, api.id)).toEqual(api);
    expect(await engine.listApis(ORG)).toHaveLength(1);
    expect(await engine.findApiByCode(ORG, 'missing')).toBeNull();
  });

  it('apis are isolated per organization', async () => {
    const { engine } = setup();
    await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    await engine.registerApi('org-2', { code: 'CRM', name: 'CRM API' });
    expect(await engine.listApis(ORG)).toHaveLength(1);
    expect(await engine.listApis('org-2')).toHaveLength(1);
  });
});

describe('RegistryEngine — Version Registry', () => {
  it('createVersion() starts at draft status', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    expect(version.status).toBe('draft');
  });

  it('createVersion() throws ApiNotFoundError for an unknown api', async () => {
    const { engine } = setup();
    await expect(engine.createVersion(ORG, { apiId: 'missing', version: 'v1' })).rejects.toBeInstanceOf(ApiNotFoundError);
  });

  it('publishVersion() moves draft -> published and publishes version.published', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('version.published', (payload) => (seen = payload));
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const published = await engine.publishVersion(ORG, version.id);
    expect(published.status).toBe('published');
    expect(seen).toEqual({ organizationId: ORG, versionId: version.id, apiId: api.id, version: 'v1' });
  });

  it('deprecateVersion() -> retireVersion() progresses the lifecycle', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    await engine.publishVersion(ORG, version.id);
    const deprecated = await engine.deprecateVersion(ORG, version.id);
    expect(deprecated.status).toBe('deprecated');
    const retired = await engine.retireVersion(ORG, version.id);
    expect(retired.status).toBe('retired');
  });

  it('rejects publishVersion() called on an already-published version', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    await engine.publishVersion(ORG, version.id);
    await expect(engine.publishVersion(ORG, version.id)).rejects.toBeInstanceOf(InvalidApiVersionTransitionError);
  });

  it('publishVersion() throws ApiVersionNotFoundError for an unknown version', async () => {
    const { engine } = setup();
    await expect(engine.publishVersion(ORG, 'missing')).rejects.toBeInstanceOf(ApiVersionNotFoundError);
  });

  it('listVersionsForApi() returns only that api’s versions', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const other = await engine.registerApi(ORG, { code: 'HR', name: 'HR API' });
    await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    await engine.createVersion(ORG, { apiId: other.id, version: 'v1' });
    expect(await engine.listVersionsForApi(ORG, api.id)).toHaveLength(1);
  });
});

describe('RegistryEngine — Endpoint Registry', () => {
  it('registerEndpoint() succeeds when the api and version exist', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await engine.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    expect(endpoint.name).toBe('Customers');
  });

  it('registerEndpoint() throws ApiNotFoundError for an unknown api', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    await expect(engine.registerEndpoint(ORG, { apiId: 'missing', versionId: version.id, name: 'X' })).rejects.toBeInstanceOf(ApiNotFoundError);
  });

  it('registerEndpoint() throws ApiVersionNotFoundError for an unknown version', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    await expect(engine.registerEndpoint(ORG, { apiId: api.id, versionId: 'missing', name: 'X' })).rejects.toBeInstanceOf(ApiVersionNotFoundError);
  });

  it('listEndpointsForVersion() returns only that version’s endpoints', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const v1 = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const v2 = await engine.createVersion(ORG, { apiId: api.id, version: 'v2' });
    await engine.registerEndpoint(ORG, { apiId: api.id, versionId: v1.id, name: 'Customers' });
    await engine.registerEndpoint(ORG, { apiId: api.id, versionId: v2.id, name: 'Customers' });
    expect(await engine.listEndpointsForVersion(ORG, v1.id)).toHaveLength(1);
  });
});

describe('RegistryEngine — Route Registry', () => {
  it('registerRoute() succeeds when the endpoint exists, defaults requiresAuth to true', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await engine.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    const route = await engine.registerRoute(ORG, { endpointId: endpoint.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' });
    expect(route.requiresAuth).toBe(true);
  });

  it('publishes route.registered', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('route.registered', (payload) => (seen = payload));
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await engine.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    const route = await engine.registerRoute(ORG, { endpointId: endpoint.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' });
    expect(seen).toEqual({ organizationId: ORG, routeId: route.id, method: 'GET', path: '/crm/customers' });
  });

  it('registerRoute() rejects a duplicate method+path within the organization', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await engine.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    await engine.registerRoute(ORG, { endpointId: endpoint.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' });
    await expect(
      engine.registerRoute(ORG, { endpointId: endpoint.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' }),
    ).rejects.toBeInstanceOf(DuplicateRouteError);
  });

  it('allows the same path with a different method', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await engine.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    await engine.registerRoute(ORG, { endpointId: endpoint.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' });
    await expect(
      engine.registerRoute(ORG, { endpointId: endpoint.id, method: 'POST', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' }),
    ).resolves.toBeTruthy();
  });

  it('registerRoute() throws EndpointNotFoundError for an unknown endpoint', async () => {
    const { engine } = setup();
    await expect(
      engine.registerRoute(ORG, { endpointId: 'missing', method: 'GET', path: '/x', targetService: 'crm-engine', targetOperation: 'getCustomerContext' }),
    ).rejects.toBeInstanceOf(EndpointNotFoundError);
  });

  it('findRouteByMethodAndPath() finds a registered route, null for unknown', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await engine.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    const route = await engine.registerRoute(ORG, { endpointId: endpoint.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' });
    expect(await engine.findRouteByMethodAndPath(ORG, 'GET', '/crm/customers')).toEqual(route);
    expect(await engine.findRouteByMethodAndPath(ORG, 'GET', '/unknown')).toBeNull();
  });

  it('registerRoute() accepts requiresAuth: false, rateLimitPolicyId, and requestSchemaId', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await engine.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    const route = await engine.registerRoute(ORG, {
      endpointId: endpoint.id,
      method: 'GET',
      path: '/crm/customers',
      targetService: 'crm-engine',
      targetOperation: 'getCustomerContext',
      requiresAuth: false,
      rateLimitPolicyId: 'ratelimit-1',
      requestSchemaId: 'schema-1',
    });
    expect(route.requiresAuth).toBe(false);
    expect(route.rateLimitPolicyId).toBe('ratelimit-1');
    expect(route.requestSchemaId).toBe('schema-1');
  });

  it('listRoutesForEndpoint() / listAllRoutes() / getRoute() work as expected', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await engine.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    const route = await engine.registerRoute(ORG, { endpointId: endpoint.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' });
    expect(await engine.listRoutesForEndpoint(ORG, endpoint.id)).toEqual([route]);
    expect(await engine.listAllRoutes(ORG)).toEqual([route]);
    expect(await engine.getRoute(ORG, route.id)).toEqual(route);
    expect(await engine.getRoute(ORG, 'missing')).toBeNull();
  });

  it('listAllRoutes() aggregates routes registered across multiple endpoints', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const customers = await engine.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    const opportunities = await engine.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Opportunities' });
    await engine.registerRoute(ORG, { endpointId: customers.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' });
    await engine.registerRoute(ORG, { endpointId: opportunities.id, method: 'GET', path: '/crm/opportunities', targetService: 'sales-engine', targetOperation: 'getOpportunityContext' });
    expect(await engine.listAllRoutes(ORG)).toHaveLength(2);
  });

  it('getEndpoint() returns null for an unknown endpoint id', async () => {
    const { engine } = setup();
    expect(await engine.getEndpoint(ORG, 'missing')).toBeNull();
  });

  it('retireVersion() from draft (without publishing first) is an invalid transition', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    await expect(engine.retireVersion(ORG, version.id)).rejects.toBeInstanceOf(InvalidApiVersionTransitionError);
  });

  it('a retired api version cannot be deprecated again', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    await engine.publishVersion(ORG, version.id);
    await engine.deprecateVersion(ORG, version.id);
    await engine.retireVersion(ORG, version.id);
    await expect(engine.deprecateVersion(ORG, version.id)).rejects.toBeInstanceOf(InvalidApiVersionTransitionError);
  });

  it('deprecateApi() cannot be applied to an already-retired api', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    await engine.retireApi(ORG, api.id);
    await expect(engine.deprecateApi(ORG, api.id)).rejects.toBeInstanceOf(InvalidApiTransitionError);
  });

  it('registerApi() accepts an optional description', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API', description: 'Customer relationship endpoints' });
    expect(api.description).toBe('Customer relationship endpoints');
  });

  it('routes, endpoints, and versions are all isolated per organization', async () => {
    const { engine } = setup();
    const api = await engine.registerApi(ORG, { code: 'CRM', name: 'CRM API' });
    const version = await engine.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await engine.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    await engine.registerRoute(ORG, { endpointId: endpoint.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' });

    expect(await engine.listVersionsForApi('org-2', api.id)).toEqual([]);
    expect(await engine.listEndpointsForVersion('org-2', version.id)).toEqual([]);
    expect(await engine.listAllRoutes('org-2')).toEqual([]);
  });
});
