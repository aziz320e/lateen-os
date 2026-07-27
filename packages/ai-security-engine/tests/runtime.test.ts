import { describe, expect, it } from 'vitest';
import { createSecurityRuntime } from '../src/runtime.js';
import { createSecurityEventBus } from '../src/events/security-event-bus.js';

describe('createSecurityRuntime', () => {
  it('exposes only services, queries, and the event bus — never repositories', () => {
    const runtime = createSecurityRuntime();
    expect(Object.keys(runtime).sort()).toEqual(
      [
        'identity',
        'authentication',
        'authorization',
        'secrets',
        'providerSecurity',
        'promptSecurity',
        'toolSecurity',
        'dataSecurity',
        'threatDetection',
        'audit',
        'relationships',
        'queries',
        'events',
      ].sort(),
    );
  });

  it('accepts an injected eventBus and now()', async () => {
    const eventBus = createSecurityEventBus();
    const fixedNow = '2024-01-01T00:00:00.000Z';
    const runtime = createSecurityRuntime({ eventBus, now: () => fixedNow });

    expect(runtime.events).toBe(eventBus);
    const identity = await runtime.identity.createAiIdentity('org-1', { name: 'AI Worker' });
    expect(identity.createdAt).toBe(fixedNow);
  });

  it('is fully usable offline with zero injected collaborators', async () => {
    const runtime = createSecurityRuntime();
    expect(await runtime.relationships.getBusinessProfileContext('org-1')).toBeNull();
    expect(runtime.toolSecurity.isToolRegisteredInRuntime('search')).toBe(false);
    expect(runtime.providerSecurity.isProviderRegisteredInHub('openai')).toBe(false);
  });

  it('runtime instances are independent — no shared module-level state', async () => {
    const runtimeA = createSecurityRuntime();
    const runtimeB = createSecurityRuntime();
    await runtimeA.identity.createAiIdentity('org-1', { name: 'AI Worker' });

    const result = await runtimeB.queries.findAuditEvents({ organizationId: 'org-1' });
    expect(result.total).toBe(0);
  });

  it('authentication composes the same identity data exposed on the runtime', async () => {
    const runtime = createSecurityRuntime();
    const { secret } = await runtime.identity.createSessionIdentity('org-1', { name: 'Session' });
    const validated = await runtime.authentication.validateSession('org-1', secret);
    expect(validated).not.toBeNull();
  });

  it('prompt security composes the same audit sink exposed on the runtime', async () => {
    const runtime = createSecurityRuntime();
    await runtime.promptSecurity.auditPrompt('org-1', { prompt: 'hello', outcome: 'success' });
    const events = await runtime.audit.findByCategory('org-1', 'prompt');
    expect(events).toHaveLength(1);
  });
});
