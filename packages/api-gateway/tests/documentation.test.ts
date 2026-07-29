import { describe, expect, it } from 'vitest';
import { buildApiDocumentationModel, buildOpenApiDocument, createDocumentationEngine } from '../src/documentation/engine.impl.js';
import { createRegistryEngine } from '../src/registry/engine.impl.js';
import { createApiRepository, createApiVersionRepository, createEndpointRepository, createRouteRepository } from '../src/registry/repository.impl.js';
import { ApiNotFoundError, ApiVersionNotFoundError } from '../src/shared/errors.js';
import type { Api, ApiVersion, Endpoint, Route } from '../src/registry/types.js';

const ORG = 'org-1';

function makeApi(overrides: Partial<Api> = {}): Api {
  return {
    id: 'api-x',
    organizationId: ORG,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    code: 'crm',
    name: 'CRM API',
    status: 'active',
    ...overrides,
  };
}

function makeVersion(overrides: Partial<ApiVersion> = {}): ApiVersion {
  return {
    id: 'version-x',
    organizationId: ORG,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    apiId: 'api-x',
    version: 'v1',
    status: 'draft',
    ...overrides,
  };
}

function makeEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    id: 'endpoint-x',
    organizationId: ORG,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    apiId: 'api-x',
    versionId: 'version-x',
    name: 'Customers',
    description: 'Customer records',
    ...overrides,
  };
}

function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 'route-x',
    organizationId: ORG,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    endpointId: 'endpoint-x',
    method: 'GET',
    path: '/crm/customers',
    targetService: 'crm-engine',
    targetOperation: 'getCustomerContext',
    requiresAuth: true,
    ...overrides,
  };
}

describe('buildOpenApiDocument (pure)', () => {
  it('builds a minimal OpenAPI 3.0.3 document from Registry data', () => {
    const api = makeApi();
    const version = makeVersion();
    const endpoint = makeEndpoint();
    const route = makeRoute();
    const document = buildOpenApiDocument(api, version, [endpoint], new Map([[endpoint.id, [route]]]));
    expect(document.openapi).toBe('3.0.3');
    expect(document.info).toEqual({ title: 'CRM API', version: 'v1' });
    expect(document.paths['/crm/customers']?.['get']).toEqual({ operationId: 'get_crm_customers', summary: 'Customer records', tags: ['Customers'] });
  });

  it('groups multiple methods on the same path under one paths entry', () => {
    const api = makeApi();
    const version = makeVersion();
    const endpoint = makeEndpoint();
    const getRoute = makeRoute({ id: 'r1', method: 'GET' });
    const postRoute = makeRoute({ id: 'r2', method: 'POST' });
    const document = buildOpenApiDocument(api, version, [endpoint], new Map([[endpoint.id, [getRoute, postRoute]]]));
    expect(Object.keys(document.paths['/crm/customers'] ?? {})).toEqual(['get', 'post']);
  });

  it('produces an empty paths object when there are no endpoints', () => {
    const document = buildOpenApiDocument(makeApi(), makeVersion(), [], new Map());
    expect(document.paths).toEqual({});
  });
});

describe('buildApiDocumentationModel (pure)', () => {
  it('projects api/version/endpoint/route data into a documentation model', () => {
    const api = makeApi();
    const version = makeVersion();
    const endpoint = makeEndpoint();
    const route = makeRoute();
    const model = buildApiDocumentationModel(api, version, [endpoint], new Map([[endpoint.id, [route]]]));
    expect(model).toEqual({
      apiCode: 'crm',
      apiName: 'CRM API',
      version: 'v1',
      endpoints: [{ name: 'Customers', description: 'Customer records', routes: [{ method: 'GET', path: '/crm/customers', requiresAuth: true }] }],
    });
  });

  it('an endpoint with no routes still appears with an empty routes array', () => {
    const endpoint = makeEndpoint();
    const model = buildApiDocumentationModel(makeApi(), makeVersion(), [endpoint], new Map());
    expect(model.endpoints[0]?.routes).toEqual([]);
  });
});

describe('DocumentationEngine (composed with a real RegistryEngine)', () => {
  function setup() {
    const registry = createRegistryEngine(createApiRepository(), createApiVersionRepository(), createEndpointRepository(), createRouteRepository());
    const documentation = createDocumentationEngine(registry);
    return { registry, documentation };
  }

  async function registerFullApi(registry: ReturnType<typeof createRegistryEngine>) {
    const api = await registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    const version = await registry.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await registry.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers', description: 'Customer records' });
    const route = await registry.registerRoute(ORG, {
      endpointId: endpoint.id,
      method: 'GET',
      path: '/crm/customers',
      targetService: 'crm-engine',
      targetOperation: 'getCustomerContext',
    });
    return { api, version, endpoint, route };
  }

  it('generateOpenApiDocument() reflects real, live Registry state', async () => {
    const { registry, documentation } = setup();
    const { api, version } = await registerFullApi(registry);
    const document = await documentation.generateOpenApiDocument(ORG, api.id, version.id);
    expect(document.paths['/crm/customers']?.['get']?.operationId).toBe('get_crm_customers');
  });

  it('generateApiDocumentation() reflects real, live Registry state', async () => {
    const { registry, documentation } = setup();
    const { api, version } = await registerFullApi(registry);
    const model = await documentation.generateApiDocumentation(ORG, api.id, version.id);
    expect(model.apiCode).toBe('crm');
    expect(model.endpoints[0]?.routes[0]?.path).toBe('/crm/customers');
  });

  it('throws ApiNotFoundError for an unknown api', async () => {
    const { registry, documentation } = setup();
    const { version } = await registerFullApi(registry);
    await expect(documentation.generateOpenApiDocument(ORG, 'missing', version.id)).rejects.toBeInstanceOf(ApiNotFoundError);
  });

  it('throws ApiVersionNotFoundError for an unknown version', async () => {
    const { registry, documentation } = setup();
    const { api } = await registerFullApi(registry);
    await expect(documentation.generateOpenApiDocument(ORG, api.id, 'missing')).rejects.toBeInstanceOf(ApiVersionNotFoundError);
  });

  it('generateApiDocumentation() reflects a route registered with requiresAuth: false', async () => {
    const { registry, documentation } = setup();
    const api = await registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    const version = await registry.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await registry.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Health' });
    await registry.registerRoute(ORG, { endpointId: endpoint.id, method: 'GET', path: '/health', targetService: 'observability-engine', targetOperation: 'getObservabilityHealthContext', requiresAuth: false });

    const model = await documentation.generateApiDocumentation(ORG, api.id, version.id);
    expect(model.endpoints[0]?.routes[0]).toEqual({ method: 'GET', path: '/health', requiresAuth: false });
  });

  it('generateOpenApiDocument() covers every endpoint registered under the version', async () => {
    const { registry, documentation } = setup();
    const api = await registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    const version = await registry.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const customersEndpoint = await registry.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    const opportunitiesEndpoint = await registry.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Opportunities' });
    await registry.registerRoute(ORG, { endpointId: customersEndpoint.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' });
    await registry.registerRoute(ORG, { endpointId: opportunitiesEndpoint.id, method: 'GET', path: '/crm/opportunities', targetService: 'sales-engine', targetOperation: 'getOpportunityContext' });

    const document = await documentation.generateOpenApiDocument(ORG, api.id, version.id);
    expect(Object.keys(document.paths).sort()).toEqual(['/crm/customers', '/crm/opportunities']);
  });

  it('buildOpenApiDocument() derives operationId from a path with multiple segments', () => {
    const document = buildOpenApiDocument(makeApi(), makeVersion(), [makeEndpoint()], new Map([['endpoint-x', [makeRoute({ path: '/crm/customers/notes', method: 'POST' })]]]));
    expect(document.paths['/crm/customers/notes']?.['post']?.operationId).toBe('post_crm_customers_notes');
  });

  it('an api with no registered versions still documents cleanly for the version it does have', async () => {
    const { registry, documentation } = setup();
    const api = await registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    const version = await registry.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const document = await documentation.generateOpenApiDocument(ORG, api.id, version.id);
    expect(document.paths).toEqual({});
  });
});
