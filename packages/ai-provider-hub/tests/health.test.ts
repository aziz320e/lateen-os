import { describe, expect, it } from 'vitest';
import { createProviderRegistry } from '../src/provider/registry.impl.js';
import { createProviderHealth } from '../src/provider/health.impl.js';

describe('createProviderHealth', () => {
  it('reports status from an injected check function (no live network needed)', async () => {
    const registry = createProviderRegistry();
    const health = createProviderHealth(registry, {
      check: async () => ({ status: 'active', latencyMs: 42 }),
    });

    const snapshot = await health.check('openai');
    expect(snapshot.status).toBe('active');
    expect(snapshot.latencyMs).toBe(42);
    expect(snapshot.kind).toBe('openai');
    expect(snapshot.providerId).toBe('openai');
  });

  it('throws for an unregistered provider id', async () => {
    const registry = createProviderRegistry();
    const health = createProviderHealth(registry, { check: async () => ({ status: 'active' }) });
    await expect(health.check('nonexistent')).rejects.toThrow(/not registered/);
  });

  it('checkAll checks every registered provider', async () => {
    const registry = createProviderRegistry();
    const health = createProviderHealth(registry, { check: async () => ({ status: 'active' }) });
    const snapshots = await health.checkAll();
    expect(snapshots).toHaveLength(registry.list().length);
  });

  it('checkByKind checks only providers of the given kind', async () => {
    const registry = createProviderRegistry();
    const health = createProviderHealth(registry, { check: async () => ({ status: 'active' }) });
    const snapshots = await health.checkByKind('anthropic');
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]!.kind).toBe('anthropic');
  });

  it('isAvailable is true for active/degraded and false for unavailable', async () => {
    const registry = createProviderRegistry();

    const activeHealth = createProviderHealth(registry, { check: async () => ({ status: 'active' }) });
    await expect(activeHealth.isAvailable('openai')).resolves.toBe(true);

    const degradedHealth = createProviderHealth(registry, { check: async () => ({ status: 'degraded' }) });
    await expect(degradedHealth.isAvailable('openai')).resolves.toBe(true);

    const unavailableHealth = createProviderHealth(registry, { check: async () => ({ status: 'unavailable' }) });
    await expect(unavailableHealth.isAvailable('openai')).resolves.toBe(false);
  });

  it('the default HTTP liveness check reports unavailable for an unreachable host, without throwing', async () => {
    const registry = createProviderRegistry({
      seed: [
        {
          metadata: {
            id: 'unreachable',
            kind: 'openai',
            displayName: 'Unreachable',
            description: 'test',
            capabilities: ['chat-completion'],
            supportsLocalDeployment: false,
            supportsReasoningModels: false,
          },
          configuration: { baseUrl: 'http://127.0.0.1:1' },
          status: 'active',
          priority: 0,
        },
      ],
    });
    const health = createProviderHealth(registry, { checkTimeoutMs: 500 });
    const snapshot = await health.check('unreachable');
    expect(snapshot.status).toBe('unavailable');
  });
});
