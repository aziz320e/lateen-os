import { describe, expect, it } from 'vitest';
import { createGatewayEventBus, GATEWAY_EVENT_NAMES } from '../src/events/index.js';

describe('GatewayEventBus', () => {
  it('publishes and delivers events by name', () => {
    const bus = createGatewayEventBus();
    let seen: unknown;
    bus.subscribe('api.registered', (payload) => (seen = payload));
    bus.publish('api.registered', { organizationId: 'org-1', apiId: 'api-1', code: 'CRM' });
    expect(seen).toEqual({ organizationId: 'org-1', apiId: 'api-1', code: 'CRM' });
  });

  it('subscribeAll() receives every event regardless of name', () => {
    const bus = createGatewayEventBus();
    const names: string[] = [];
    bus.subscribeAll((name) => names.push(name));
    bus.publish('route.registered', { organizationId: 'org-1', routeId: 'route-1', method: 'GET', path: '/x' });
    bus.publish('version.published', { organizationId: 'org-1', versionId: 'ver-1', apiId: 'api-1', version: 'v1' });
    expect(names).toEqual(['route.registered', 'version.published']);
  });

  it('unsubscribe stops delivery', () => {
    const bus = createGatewayEventBus();
    let count = 0;
    const unsubscribe = bus.subscribe('apikey.issued', () => (count += 1));
    bus.publish('apikey.issued', { organizationId: 'org-1', apiKeyId: 'key-1', name: 'Test Key' });
    unsubscribe();
    bus.publish('apikey.issued', { organizationId: 'org-1', apiKeyId: 'key-1', name: 'Test Key' });
    expect(count).toBe(1);
  });

  it('delivers apikey.revoked with its payload', () => {
    const bus = createGatewayEventBus();
    let seen: unknown;
    bus.subscribe('apikey.revoked', (payload) => (seen = payload));
    bus.publish('apikey.revoked', { organizationId: 'org-1', apiKeyId: 'key-1' });
    expect(seen).toEqual({ organizationId: 'org-1', apiKeyId: 'key-1' });
  });

  it('delivers request.received with its payload', () => {
    const bus = createGatewayEventBus();
    let seen: unknown;
    bus.subscribe('request.received', (payload) => (seen = payload));
    bus.publish('request.received', { organizationId: 'org-1', correlationId: 'corr-1', method: 'GET', path: '/x' });
    expect(seen).toEqual({ organizationId: 'org-1', correlationId: 'corr-1', method: 'GET', path: '/x' });
  });

  it('delivers request.completed with its payload', () => {
    const bus = createGatewayEventBus();
    let seen: unknown;
    bus.subscribe('request.completed', (payload) => (seen = payload));
    bus.publish('request.completed', { organizationId: 'org-1', correlationId: 'corr-1', statusCode: 200 });
    expect(seen).toEqual({ organizationId: 'org-1', correlationId: 'corr-1', statusCode: 200 });
  });

  it('delivers request.rejected with its payload', () => {
    const bus = createGatewayEventBus();
    let seen: unknown;
    bus.subscribe('request.rejected', (payload) => (seen = payload));
    bus.publish('request.rejected', { organizationId: 'org-1', correlationId: 'corr-1', reason: 'route_not_found' });
    expect(seen).toEqual({ organizationId: 'org-1', correlationId: 'corr-1', reason: 'route_not_found' });
  });

  it('delivers ratelimit.exceeded and quota.exceeded with their payloads', () => {
    const bus = createGatewayEventBus();
    const seen: unknown[] = [];
    bus.subscribe('ratelimit.exceeded', (payload) => seen.push(payload));
    bus.subscribe('quota.exceeded', (payload) => seen.push(payload));
    bus.publish('ratelimit.exceeded', { organizationId: 'org-1', policyId: 'policy-1', principalId: 'principal-1' });
    bus.publish('quota.exceeded', { organizationId: 'org-1', quotaId: 'quota-1', principalId: 'principal-1' });
    expect(seen).toHaveLength(2);
  });

  it('multiple independent subscribers to the same event all receive it', () => {
    const bus = createGatewayEventBus();
    let countA = 0;
    let countB = 0;
    bus.subscribe('api.registered', () => (countA += 1));
    bus.subscribe('api.registered', () => (countB += 1));
    bus.publish('api.registered', { organizationId: 'org-1', apiId: 'api-1', code: 'CRM' });
    expect(countA).toBe(1);
    expect(countB).toBe(1);
  });

  it('delivers version.published with its payload', () => {
    const bus = createGatewayEventBus();
    let seen: unknown;
    bus.subscribe('version.published', (payload) => (seen = payload));
    bus.publish('version.published', { organizationId: 'org-1', versionId: 'version-1', apiId: 'api-1', version: 'v1' });
    expect(seen).toEqual({ organizationId: 'org-1', versionId: 'version-1', apiId: 'api-1', version: 'v1' });
  });

  it('delivers route.registered with its payload', () => {
    const bus = createGatewayEventBus();
    let seen: unknown;
    bus.subscribe('route.registered', (payload) => (seen = payload));
    bus.publish('route.registered', { organizationId: 'org-1', routeId: 'route-1', method: 'POST', path: '/crm/customers' });
    expect(seen).toEqual({ organizationId: 'org-1', routeId: 'route-1', method: 'POST', path: '/crm/customers' });
  });

  it('a subscriber to one event name is not invoked for a different event', () => {
    const bus = createGatewayEventBus();
    let calls = 0;
    bus.subscribe('api.registered', () => (calls += 1));
    bus.publish('route.registered', { organizationId: 'org-1', routeId: 'route-1', method: 'GET', path: '/x' });
    expect(calls).toBe(0);
  });

  it('unsubscribing one subscriber does not affect another subscriber to the same event', () => {
    const bus = createGatewayEventBus();
    let countA = 0;
    let countB = 0;
    const unsubscribeA = bus.subscribe('api.registered', () => (countA += 1));
    bus.subscribe('api.registered', () => (countB += 1));
    unsubscribeA();
    bus.publish('api.registered', { organizationId: 'org-1', apiId: 'api-1', code: 'CRM' });
    expect(countA).toBe(0);
    expect(countB).toBe(1);
  });

  it('GATEWAY_EVENT_NAMES exposes all 10 canonical event names', () => {
    expect(Object.values(GATEWAY_EVENT_NAMES)).toEqual([
      'api.registered',
      'route.registered',
      'version.published',
      'apikey.issued',
      'apikey.revoked',
      'request.received',
      'request.completed',
      'request.rejected',
      'ratelimit.exceeded',
      'quota.exceeded',
    ]);
  });
});
