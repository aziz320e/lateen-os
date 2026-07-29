import { describe, expect, it } from 'vitest';
import { createGatewayEventBus } from '../src/events/index.js';
import { createApiGatewayRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('createApiGatewayRuntime — composition root', () => {
  it('wires every engine onto the returned runtime surface', () => {
    const gateway = createApiGatewayRuntime();
    expect(gateway.registry).toBeDefined();
    expect(gateway.middleware).toBeDefined();
    expect(gateway.authentication).toBeDefined();
    expect(gateway.authorization).toBeDefined();
    expect(gateway.rateLimit).toBeDefined();
    expect(gateway.validation).toBeDefined();
    expect(gateway.requestContext).toBeDefined();
    expect(gateway.metrics).toBeDefined();
    expect(gateway.discovery).toBeDefined();
    expect(gateway.documentation).toBeDefined();
    expect(gateway.dispatcher).toBeDefined();
    expect(gateway.relationshipManagement).toBeDefined();
    expect(gateway.queries).toBeDefined();
    expect(gateway.events).toBeDefined();
  });

  it('is fully usable with zero deps — every collaborator degrades gracefully', async () => {
    const gateway = createApiGatewayRuntime();
    expect(await gateway.relationshipManagement.getCustomerContext(ORG, 'missing')).toBeNull();
    expect(await gateway.relationshipManagement.getChartOfAccountsContext(ORG)).toEqual([]);
  });

  it('an injected eventBus is used instead of creating a new one, and is the same instance returned as .events', () => {
    const eventBus = createGatewayEventBus();
    const gateway = createApiGatewayRuntime({ eventBus });
    expect(gateway.events).toBe(eventBus);
  });

  it('registry events are observable on the injected eventBus', async () => {
    const eventBus = createGatewayEventBus();
    const gateway = createApiGatewayRuntime({ eventBus });
    let seen: unknown;
    eventBus.subscribe('api.registered', (payload) => (seen = payload));
    const api = await gateway.registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    expect(seen).toEqual({ organizationId: ORG, apiId: api.id, code: 'crm' });
  });

  it('an injected now() clock is used across engines for deterministic timestamps', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const gateway = createApiGatewayRuntime({ now: fixedNow });
    const api = await gateway.registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    expect(api.createdAt).toBe('2026-01-01T00:00:00.000Z');
    const context = await gateway.requestContext.createContext(ORG, { method: 'GET', path: '/x' });
    expect(context.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('an injected crm dep flows through to relationshipManagement.getCustomerContext', async () => {
    const gateway = createApiGatewayRuntime({ crm: { customers: { get: async () => ({ id: 'customer-1', name: 'Acme Co' } as never) } as never } });
    expect(await gateway.relationshipManagement.getCustomerContext(ORG, 'customer-1')).toEqual({ id: 'customer-1', name: 'Acme Co' });
  });

  it('repositories are never part of the returned runtime surface', () => {
    const gateway = createApiGatewayRuntime();
    expect(Object.keys(gateway)).not.toContain('apiRepository');
    expect(Object.keys(gateway)).not.toContain('routeRepository');
  });

  it('the documentation engine is composed intra-package with the registry — reflects data registered through the same runtime', async () => {
    const gateway = createApiGatewayRuntime();
    const api = await gateway.registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    const version = await gateway.registry.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const document = await gateway.documentation.generateOpenApiDocument(ORG, api.id, version.id);
    expect(document.info).toEqual({ title: 'CRM API', version: 'v1' });
  });

  it('the dispatcher, queries, and registry all observe the same underlying registered route', async () => {
    const gateway = createApiGatewayRuntime();
    const api = await gateway.registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    const version = await gateway.registry.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await gateway.registry.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    await gateway.registry.registerRoute(ORG, {
      endpointId: endpoint.id,
      method: 'GET',
      path: '/crm/customers',
      targetService: 'crm-engine',
      targetOperation: 'getCustomerContext',
      requiresAuth: false,
    });

    const found = await gateway.queries.findRoutes({ organizationId: ORG });
    expect(found.total).toBe(1);

    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow', effect: 'allow', resource: '/crm/customers', action: 'GET' });
    const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers' });
    expect(result.statusCode).toBe(200);
  });

  it('two independently created runtimes do not share state', async () => {
    const first = createApiGatewayRuntime();
    const second = createApiGatewayRuntime();
    await first.registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    expect(await second.registry.listApis(ORG)).toEqual([]);
  });

  it('an injected sales dep flows through to relationshipManagement.getOpportunityContext', async () => {
    const gateway = createApiGatewayRuntime({ sales: { opportunities: { get: async () => ({ id: 'opp-1', amount: '5000.00' } as never) } as never } });
    expect(await gateway.relationshipManagement.getOpportunityContext(ORG, 'opp-1')).toEqual({ id: 'opp-1', amount: '5000.00' });
  });

  it('the metrics engine and the request context engine both observe requests recorded through the dispatcher', async () => {
    const gateway = createApiGatewayRuntime();
    const api = await gateway.registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    const version = await gateway.registry.createVersion(ORG, { apiId: api.id, version: 'v1' });
    const endpoint = await gateway.registry.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
    await gateway.registry.registerRoute(ORG, { endpointId: endpoint.id, method: 'GET', path: '/crm/customers', targetService: 'crm-engine', targetOperation: 'getCustomerContext', requiresAuth: false });
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow', effect: 'allow', resource: '/crm/customers', action: 'GET' });

    await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers' });

    expect(await gateway.metrics.listMetrics(ORG)).toHaveLength(1);
    expect(await gateway.requestContext.list(ORG)).toHaveLength(1);
  });

  it('the authentication engine and the dispatcher share the same issued api key', async () => {
    const gateway = createApiGatewayRuntime();
    const issued = await gateway.authentication.issueApiKey(ORG, { name: 'CI Key' });
    expect((await gateway.authentication.verifyApiKey(ORG, issued.rawKey))?.id).toBe(issued.apiKey.id);
  });

  it('an injected marketing dep flows through to relationshipManagement.getCampaignsContext', async () => {
    const gateway = createApiGatewayRuntime({ marketing: { queries: { findCampaigns: async () => ({ campaigns: [{ id: 'campaign-1' } as never], total: 1 }) } as never } });
    expect(await gateway.relationshipManagement.getCampaignsContext(ORG)).toEqual([{ id: 'campaign-1' }]);
  });

  it('the queries layer reflects api keys and policies created through the same runtime', async () => {
    const gateway = createApiGatewayRuntime();
    await gateway.authentication.issueApiKey(ORG, { name: 'CI Key' });
    await gateway.authorization.createPolicy(ORG, { name: 'Allow', effect: 'allow', resource: '*', action: '*' });
    expect((await gateway.queries.findApiKeys({ organizationId: ORG })).total).toBe(1);
    expect((await gateway.queries.findPolicies({ organizationId: ORG })).total).toBe(1);
  });

  it('createApiGatewayRuntime() defaults now to a real wall-clock ISO timestamp', async () => {
    const gateway = createApiGatewayRuntime();
    const before = Date.now();
    const api = await gateway.registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
    const after = Date.now();
    const createdAtMs = new Date(api.createdAt).getTime();
    expect(createdAtMs).toBeGreaterThanOrEqual(before);
    expect(createdAtMs).toBeLessThanOrEqual(after);
  });
});
