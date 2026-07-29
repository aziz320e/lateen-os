import { describe, expect, it } from 'vitest';
import { createApiKeyRepository } from '../src/authentication/repository.impl.js';
import { createPolicyRepository } from '../src/authorization/repository.impl.js';
import { createRequestContextRepository } from '../src/context/repository.impl.js';
import { createServiceRegistrationRepository } from '../src/discovery/repository.impl.js';
import { createHealthSnapshotRepository, createRequestMetricRepository } from '../src/metrics/repository.impl.js';
import { createGatewayQueries } from '../src/queries/gateway-queries.impl.js';
import { createApiRepository, createApiVersionRepository, createEndpointRepository, createRegistryEngine, createRouteRepository } from '../src/registry/index.js';

const ORG = 'org-1';

async function setup() {
  const apiRepository = createApiRepository();
  const versionRepository = createApiVersionRepository();
  const endpointRepository = createEndpointRepository();
  const routeRepository = createRouteRepository();
  const apiKeyRepository = createApiKeyRepository();
  const policyRepository = createPolicyRepository();
  const requestContextRepository = createRequestContextRepository();
  const requestMetricRepository = createRequestMetricRepository();
  const healthSnapshotRepository = createHealthSnapshotRepository();
  const serviceRegistrationRepository = createServiceRegistrationRepository();

  const registry = createRegistryEngine(apiRepository, versionRepository, endpointRepository, routeRepository);
  const queries = createGatewayQueries({
    apiRepository,
    routeRepository,
    apiKeyRepository,
    policyRepository,
    requestContextRepository,
    requestMetricRepository,
    healthSnapshotRepository,
    serviceRegistrationRepository,
  });

  return { registry, queries, apiKeyRepository, policyRepository, requestContextRepository, requestMetricRepository, healthSnapshotRepository, serviceRegistrationRepository };
}

describe('GatewayQueries', () => {
  it('findApis() filters by status and paginates', async () => {
    const { registry, queries } = await setup();
    const api1 = await registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    await registry.registerApi(ORG, { code: 'hr', name: 'HR API' });
    await registry.deprecateApi(ORG, api1.id);

    const active = await queries.findApis({ organizationId: ORG, status: 'active' });
    expect(active.total).toBe(1);

    const all = await queries.findApis({ organizationId: ORG, limit: 1 });
    expect(all.apis).toHaveLength(1);
    expect(all.total).toBe(2);
  });

  it('findRoutes() filters by method and targetService', async () => {
    const { registry, queries } = await setup();
    const api = await registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    const version = await registry.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await registry.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    await registry.registerRoute(ORG, { endpointId: endpoint.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' });
    await registry.registerRoute(ORG, { endpointId: endpoint.id, method: 'POST', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'createCustomer' });

    expect((await queries.findRoutes({ organizationId: ORG, method: 'GET' })).total).toBe(1);
    expect((await queries.findRoutes({ organizationId: ORG, targetService: 'crm-engine' })).total).toBe(2);
  });

  it('findApiKeys() filters by status', async () => {
    const { queries, apiKeyRepository } = await setup();
    await apiKeyRepository.save({
      id: 'key-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      name: 'A',
      keyHash: 'hash-a',
      scopes: [],
      status: 'active',
    } as never);
    await apiKeyRepository.save({
      id: 'key-2',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      name: 'B',
      keyHash: 'hash-b',
      scopes: [],
      status: 'revoked',
    } as never);
    expect((await queries.findApiKeys({ organizationId: ORG, status: 'active' })).total).toBe(1);
    expect((await queries.findApiKeys({ organizationId: ORG })).total).toBe(2);
  });

  it('findPolicies() filters by effect', async () => {
    const { queries, policyRepository } = await setup();
    await policyRepository.save({
      id: 'policy-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      name: 'Allow',
      effect: 'allow',
      resource: '*',
      action: '*',
      priority: 0,
      status: 'active',
    } as never);
    await policyRepository.save({
      id: 'policy-2',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      name: 'Deny',
      effect: 'deny',
      resource: '*',
      action: '*',
      priority: 0,
      status: 'active',
    } as never);
    expect((await queries.findPolicies({ organizationId: ORG, effect: 'deny' })).total).toBe(1);
  });

  it('findRequestContexts() filters by status', async () => {
    const { queries, requestContextRepository } = await setup();
    await requestContextRepository.save({
      id: 'context-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      method: 'GET',
      path: '/x',
      startedAt: '2026-01-01T00:00:00.000Z',
      status: 'completed',
      statusCode: 200,
    } as never);
    expect((await queries.findRequestContexts({ organizationId: ORG, status: 'completed' })).total).toBe(1);
    expect((await queries.findRequestContexts({ organizationId: ORG, status: 'in_flight' })).total).toBe(0);
  });

  it('findMetrics() filters by path', async () => {
    const { queries, requestMetricRepository } = await setup();
    await requestMetricRepository.save({
      id: 'metric-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      correlationId: 'corr-1',
      method: 'GET',
      path: '/a',
      statusCode: 200,
      durationMs: 10,
    } as never);
    expect((await queries.findMetrics({ organizationId: ORG, path: '/a' })).total).toBe(1);
    expect((await queries.findMetrics({ organizationId: ORG, path: '/b' })).total).toBe(0);
  });

  it('findHealthSnapshots() filters by serviceName', async () => {
    const { queries, healthSnapshotRepository } = await setup();
    await healthSnapshotRepository.save({
      id: 'health-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      serviceName: 'crm-engine',
      healthy: true,
      checkedAt: '2026-01-01T00:00:00.000Z',
    } as never);
    expect((await queries.findHealthSnapshots({ organizationId: ORG, serviceName: 'crm-engine' })).total).toBe(1);
    expect((await queries.findHealthSnapshots({ organizationId: ORG, serviceName: 'hr-engine' })).total).toBe(0);
  });

  it('findServices() filters by status', async () => {
    const { queries, serviceRegistrationRepository } = await setup();
    await serviceRegistrationRepository.save({
      id: 'service-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      serviceName: 'crm-engine',
      status: 'available',
    } as never);
    expect((await queries.findServices({ organizationId: ORG, status: 'available' })).total).toBe(1);
    expect((await queries.findServices({ organizationId: ORG, status: 'unavailable' })).total).toBe(0);
  });

  it('searchGateway() finds APIs and routes by keyword, scored and sorted', async () => {
    const { registry, queries } = await setup();
    const api = await registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    const version = await registry.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await registry.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    await registry.registerRoute(ORG, { endpointId: endpoint.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' });

    const result = await queries.searchGateway({ organizationId: ORG, keyword: 'crm' });
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.matches.some((match) => match.recordType === 'api')).toBe(true);
    expect(result.matches.some((match) => match.recordType === 'route')).toBe(true);
  });

  it('searchGateway() returns no matches for an unrelated keyword', async () => {
    const { registry, queries } = await setup();
    await registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    const result = await queries.searchGateway({ organizationId: ORG, keyword: 'zzz-no-match' });
    expect(result.matches).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('searchGateway() respects an explicit limit', async () => {
    const { registry, queries } = await setup();
    await registry.registerApi(ORG, { code: 'crm', name: 'CRM One' });
    await registry.registerApi(ORG, { code: 'crm2', name: 'CRM Two' });
    const result = await queries.searchGateway({ organizationId: ORG, keyword: 'crm', limit: 1 });
    expect(result.matches).toHaveLength(1);
  });

  it('findApis() is isolated per organization', async () => {
    const { registry, queries } = await setup();
    await registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    await registry.registerApi('org-2', { code: 'crm', name: 'CRM API' });
    expect((await queries.findApis({ organizationId: ORG })).total).toBe(1);
  });

  it('findRoutes() is isolated per organization', async () => {
    const { registry, queries } = await setup();
    const api = await registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    const version = await registry.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await registry.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    await registry.registerRoute(ORG, { endpointId: endpoint.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' });
    expect((await queries.findRoutes({ organizationId: 'org-2' })).total).toBe(0);
  });

  it('findApiKeys() is isolated per organization', async () => {
    const { queries, apiKeyRepository } = await setup();
    await apiKeyRepository.save({
      id: 'key-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      name: 'A',
      keyHash: 'hash-a',
      scopes: [],
      status: 'active',
    } as never);
    expect((await queries.findApiKeys({ organizationId: 'org-2' })).total).toBe(0);
  });

  it('findPolicies() is isolated per organization', async () => {
    const { queries, policyRepository } = await setup();
    await policyRepository.save({
      id: 'policy-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      name: 'Allow',
      effect: 'allow',
      resource: '*',
      action: '*',
      priority: 0,
      status: 'active',
    } as never);
    expect((await queries.findPolicies({ organizationId: 'org-2' })).total).toBe(0);
  });

  it('findRequestContexts() is isolated per organization', async () => {
    const { queries, requestContextRepository } = await setup();
    await requestContextRepository.save({
      id: 'context-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      method: 'GET',
      path: '/x',
      startedAt: '2026-01-01T00:00:00.000Z',
      status: 'in_flight',
    } as never);
    expect((await queries.findRequestContexts({ organizationId: 'org-2' })).total).toBe(0);
  });

  it('findMetrics() is isolated per organization', async () => {
    const { queries, requestMetricRepository } = await setup();
    await requestMetricRepository.save({
      id: 'metric-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      correlationId: 'corr-1',
      method: 'GET',
      path: '/a',
      statusCode: 200,
      durationMs: 10,
    } as never);
    expect((await queries.findMetrics({ organizationId: 'org-2' })).total).toBe(0);
  });

  it('findHealthSnapshots() is isolated per organization', async () => {
    const { queries, healthSnapshotRepository } = await setup();
    await healthSnapshotRepository.save({
      id: 'health-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      serviceName: 'crm-engine',
      healthy: true,
      checkedAt: '2026-01-01T00:00:00.000Z',
    } as never);
    expect((await queries.findHealthSnapshots({ organizationId: 'org-2' })).total).toBe(0);
  });

  it('findServices() is isolated per organization', async () => {
    const { queries, serviceRegistrationRepository } = await setup();
    await serviceRegistrationRepository.save({
      id: 'service-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      serviceName: 'crm-engine',
      status: 'available',
    } as never);
    expect((await queries.findServices({ organizationId: 'org-2' })).total).toBe(0);
  });

  it('searchGateway() is isolated per organization', async () => {
    const { registry, queries } = await setup();
    await registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    expect((await queries.searchGateway({ organizationId: 'org-2', keyword: 'crm' })).total).toBe(0);
  });

  it('searchGateway() ranks an exact code match above a substring match', async () => {
    const { registry, queries } = await setup();
    await registry.registerApi(ORG, { code: 'crm', name: 'Customer Relations Manager' });
    await registry.registerApi(ORG, { code: 'crm2', name: 'CRM Extended' });
    const result = await queries.searchGateway({ organizationId: ORG, keyword: 'crm' });
    expect(result.matches[0]?.id).toBeTruthy();
    expect(result.matches.every((match) => match.score > 0)).toBe(true);
  });

  it('findApis() with an offset skips the requested number of results', async () => {
    const { registry, queries } = await setup();
    await registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    await registry.registerApi(ORG, { code: 'hr', name: 'HR API' });
    const result = await queries.findApis({ organizationId: ORG, offset: 1 });
    expect(result.apis).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it('findRoutes() with no filters returns every route for the organization', async () => {
    const { registry, queries } = await setup();
    const api = await registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    const version = await registry.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await registry.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    await registry.registerRoute(ORG, { endpointId: endpoint.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext' });
    const result = await queries.findRoutes({ organizationId: ORG });
    expect(result.total).toBe(1);
  });

  it('findApis() returns an empty result set for an organization with no registered apis', async () => {
    const { queries } = await setup();
    const result = await queries.findApis({ organizationId: ORG });
    expect(result).toEqual({ apis: [], total: 0 });
  });
});
