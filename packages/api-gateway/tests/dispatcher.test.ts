import { describe, expect, it } from 'vitest';
import { createApiGatewayRuntime } from '../src/runtime.js';

const ORG = 'org-1';

async function registerCrmRoute(
  gateway: ReturnType<typeof createApiGatewayRuntime>,
  overrides: { requiresAuth?: boolean; rateLimitPolicyId?: string; requestSchemaId?: string; method?: 'GET' | 'POST'; path?: string; targetService?: string; targetOperation?: string } = {},
) {
  const api = await gateway.registry.registerApi(ORG, { code: 'crm', name: 'CRM API' });
  const version = await gateway.registry.createVersion(ORG, { apiId: api.id, version: 'v1' });
  const endpoint = await gateway.registry.registerEndpoint(ORG, { apiId: api.id, versionId: version.id, name: 'Customers' });
  const route = await gateway.registry.registerRoute(ORG, {
    endpointId: endpoint.id,
    method: overrides.method ?? 'GET',
    path: overrides.path ?? '/crm/customers',
    targetService: overrides.targetService ?? 'crm-engine',
    targetOperation: overrides.targetOperation ?? 'getCustomerContext',
    requiresAuth: overrides.requiresAuth ?? true,
    rateLimitPolicyId: overrides.rateLimitPolicyId,
    requestSchemaId: overrides.requestSchemaId,
  });
  return { api, version, endpoint, route };
}

function setupGateway() {
  return createApiGatewayRuntime({ crm: { customers: { get: async () => ({ id: 'customer-1', name: 'Acme Co' } as never) } as never } });
}

describe('DispatcherEngine — full pipeline', () => {
  it('a fully authorized, authenticated request succeeds end-to-end', async () => {
    const gateway = setupGateway();
    const { route } = await registerCrmRoute(gateway);
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow GET', effect: 'allow', resource: route.path, action: 'GET' });
    const issued = await gateway.authentication.issueApiKey(ORG, { name: 'CI Key' });

    const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers', apiKey: issued.rawKey, body: { customerId: 'customer-1' } });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({ success: true, data: { id: 'customer-1', name: 'Acme Co' } });
    expect(result.correlationId).toBeTruthy();
  });

  it('publishes request.received and request.completed for a successful dispatch', async () => {
    const gateway = setupGateway();
    const { route } = await registerCrmRoute(gateway);
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow GET', effect: 'allow', resource: route.path, action: 'GET' });
    const issued = await gateway.authentication.issueApiKey(ORG, { name: 'CI Key' });

    const received: unknown[] = [];
    const completed: unknown[] = [];
    gateway.events.subscribe('request.received', (payload) => received.push(payload));
    gateway.events.subscribe('request.completed', (payload) => completed.push(payload));

    await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers', apiKey: issued.rawKey });
    expect(received).toHaveLength(1);
    expect(completed).toHaveLength(1);
  });

  it('rejects with 404 route_not_found for an unregistered path', async () => {
    const gateway = setupGateway();
    const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/does/not/exist' });
    expect(result.statusCode).toBe(404);
    expect(result.body).toMatchObject({ success: false, error: { message: 'route_not_found' } });
  });

  it('rejects with 503 service_unavailable when the target service was never registered with discovery', async () => {
    const gateway = setupGateway();
    await registerCrmRoute(gateway);
    const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers' });
    expect(result.statusCode).toBe(503);
    expect(result.body).toMatchObject({ error: { message: 'service_unavailable' } });
  });

  it('rejects with 401 when no credentials are given for a route that requires auth', async () => {
    const gateway = setupGateway();
    await registerCrmRoute(gateway);
    await gateway.discovery.registerService(ORG, 'crm-engine');
    const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers' });
    expect(result.statusCode).toBe(401);
    expect(result.body).toMatchObject({ error: { message: 'no_credentials' } });
  });

  it('rejects with 403 policy_denied when authenticated but no allow policy is configured', async () => {
    const gateway = setupGateway();
    await registerCrmRoute(gateway);
    await gateway.discovery.registerService(ORG, 'crm-engine');
    const issued = await gateway.authentication.issueApiKey(ORG, { name: 'CI Key' });
    const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers', apiKey: issued.rawKey });
    expect(result.statusCode).toBe(403);
    expect(result.body).toMatchObject({ error: { message: 'policy_denied' } });
  });

  it('rejects with 429 rate_limit_exceeded once the attached policy threshold is hit, and publishes ratelimit.exceeded', async () => {
    const gateway = setupGateway();
    const rateLimitPolicy = await gateway.rateLimit.createPolicy(ORG, { name: 'Strict', windowSeconds: 60, maxRequests: 1 });
    const { route } = await registerCrmRoute(gateway, { rateLimitPolicyId: rateLimitPolicy.id });
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow GET', effect: 'allow', resource: route.path, action: 'GET' });
    const issued = await gateway.authentication.issueApiKey(ORG, { name: 'CI Key' });

    let exceededEvent: unknown;
    gateway.events.subscribe('ratelimit.exceeded', (payload) => (exceededEvent = payload));

    await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers', apiKey: issued.rawKey });
    const second = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers', apiKey: issued.rawKey });

    expect(second.statusCode).toBe(429);
    expect(second.body).toMatchObject({ error: { message: 'rate_limit_exceeded' } });
    expect(exceededEvent).toBeDefined();
  });

  it('rejects with 400 validation_failed when the attached request schema is not satisfied', async () => {
    const gateway = setupGateway();
    const schema = await gateway.validation.registerSchema(ORG, { name: 'CreateCustomer', kind: 'request', fields: [{ field: 'name', type: 'string', required: true }] });
    const { route } = await registerCrmRoute(gateway, { method: 'POST', requestSchemaId: schema.id });
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow POST', effect: 'allow', resource: route.path, action: 'POST' });
    const issued = await gateway.authentication.issueApiKey(ORG, { name: 'CI Key' });

    const result = await gateway.dispatcher.dispatch(ORG, { method: 'POST', path: '/crm/customers', apiKey: issued.rawKey, body: {} });
    expect(result.statusCode).toBe(400);
    expect((result.body as { error: { message: string } }).error.message).toContain('validation_failed');
  });

  it('rejects with 502 unknown_target_operation when the route targets an operation outside the fixed invoker map', async () => {
    const gateway = setupGateway();
    const { route } = await registerCrmRoute(gateway, { targetService: 'crm-engine', targetOperation: 'deleteEverything', requiresAuth: false });
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow GET', effect: 'allow', resource: route.path, action: 'GET' });

    const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers' });
    expect(result.statusCode).toBe(502);
    expect(result.body).toMatchObject({ error: { message: 'unknown_target_operation' } });
  });

  it('an unauthenticated request succeeds when the route does not require auth', async () => {
    const gateway = setupGateway();
    const { route } = await registerCrmRoute(gateway, { requiresAuth: false });
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow GET', effect: 'allow', resource: route.path, action: 'GET' });

    const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers' });
    expect(result.statusCode).toBe(200);
  });

  it('records a request metric for both successful and rejected dispatches', async () => {
    const gateway = setupGateway();
    const { route } = await registerCrmRoute(gateway);
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow GET', effect: 'allow', resource: route.path, action: 'GET' });
    const issued = await gateway.authentication.issueApiKey(ORG, { name: 'CI Key' });

    await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers', apiKey: issued.rawKey });
    await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/missing' });

    const metrics = await gateway.metrics.listMetrics(ORG);
    expect(metrics).toHaveLength(2);
    expect(metrics.map((metric) => metric.statusCode).sort()).toEqual([200, 404]);
  });

  it('authenticates via a real bearer token and succeeds end-to-end', async () => {
    const gateway = setupGateway();
    const { route } = await registerCrmRoute(gateway);
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow GET', effect: 'allow', resource: route.path, action: 'GET' });
    const token = gateway.authentication.issueJwt({ sub: 'user-1' }, 'secret');

    const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers', bearerToken: token, jwtSecret: 'secret' });
    expect(result.statusCode).toBe(200);
  });

  it('a policy scoped to a principalScope denies a request whose api key lacks that scope', async () => {
    const gateway = setupGateway();
    const { route } = await registerCrmRoute(gateway);
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Admin Only', effect: 'allow', resource: route.path, action: 'GET', principalScope: 'admin' });
    const issued = await gateway.authentication.issueApiKey(ORG, { name: 'CI Key', scopes: ['read'] });

    const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers', apiKey: issued.rawKey });
    expect(result.statusCode).toBe(403);
  });

  it('a policy scoped to a principalScope allows a request whose api key holds that scope', async () => {
    const gateway = setupGateway();
    const { route } = await registerCrmRoute(gateway);
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Admin Only', effect: 'allow', resource: route.path, action: 'GET', principalScope: 'admin' });
    const issued = await gateway.authentication.issueApiKey(ORG, { name: 'CI Key', scopes: ['admin'] });

    const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers', apiKey: issued.rawKey });
    expect(result.statusCode).toBe(200);
  });

  it('rate limiting keys counters per authenticated principal, not globally', async () => {
    const gateway = setupGateway();
    const rateLimitPolicy = await gateway.rateLimit.createPolicy(ORG, { name: 'Strict', windowSeconds: 60, maxRequests: 1 });
    const { route } = await registerCrmRoute(gateway, { rateLimitPolicyId: rateLimitPolicy.id });
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow GET', effect: 'allow', resource: route.path, action: 'GET' });
    const keyA = await gateway.authentication.issueApiKey(ORG, { name: 'Key A' });
    const keyB = await gateway.authentication.issueApiKey(ORG, { name: 'Key B' });

    const first = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers', apiKey: keyA.rawKey });
    const second = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers', apiKey: keyB.rawKey });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
  });

  it('a successful dispatch reuses the same correlationId across the request context, the response body, and the recorded metric', async () => {
    const gateway = setupGateway();
    const { route } = await registerCrmRoute(gateway, { requiresAuth: false });
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow GET', effect: 'allow', resource: route.path, action: 'GET' });

    const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers' });
    const metrics = await gateway.metrics.listMetrics(ORG);

    expect(result.body.meta.correlationId).toBe(result.correlationId);
    expect(metrics[0]?.correlationId).toBe(result.correlationId);
  });

  it('a rejected request marks its request context as rejected with the reason', async () => {
    const gateway = setupGateway();
    await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/does/not/exist' });
    const contexts = await gateway.requestContext.list(ORG);
    expect(contexts[0]).toMatchObject({ status: 'rejected', rejectionReason: 'route_not_found' });
  });

  it('a successful request marks its request context as completed with statusCode 200', async () => {
    const gateway = setupGateway();
    const { route } = await registerCrmRoute(gateway, { requiresAuth: false });
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow GET', effect: 'allow', resource: route.path, action: 'GET' });
    await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers' });
    const contexts = await gateway.requestContext.list(ORG);
    expect(contexts[0]).toMatchObject({ status: 'completed', statusCode: 200 });
  });

  it('a route without a rateLimitPolicyId never enforces rate limiting, regardless of request volume', async () => {
    const gateway = setupGateway();
    const { route } = await registerCrmRoute(gateway, { requiresAuth: false });
    await gateway.discovery.registerService(ORG, 'crm-engine');
    await gateway.authorization.createPolicy(ORG, { name: 'Allow GET', effect: 'allow', resource: route.path, action: 'GET' });

    for (let i = 0; i < 5; i += 1) {
      const result = await gateway.dispatcher.dispatch(ORG, { method: 'GET', path: '/crm/customers' });
      expect(result.statusCode).toBe(200);
    }
  });

  it('dispatch() is isolated per organization — a route registered in one org is not found in another', async () => {
    const gateway = setupGateway();
    await registerCrmRoute(gateway, { requiresAuth: false });
    await gateway.discovery.registerService(ORG, 'crm-engine');
    const result = await gateway.dispatcher.dispatch('org-2', { method: 'GET', path: '/crm/customers' });
    expect(result.statusCode).toBe(404);
  });
});
