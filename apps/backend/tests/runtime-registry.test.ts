import { describe, expect, it } from 'vitest';
import { ENGINE_CATALOG } from '../src/runtime-registry/engine-catalog.js';
import { RuntimeRegistryService } from '../src/runtime-registry/runtime-registry.service.js';

describe('RuntimeRegistryService', () => {
  it('constructs every hosted engine successfully', () => {
    const registry = new RuntimeRegistryService();
    registry.onModuleInit();

    const hosted = ENGINE_CATALOG.filter((entry) => entry.hosted);
    for (const entry of hosted) {
      expect(registry.has(entry.name), `expected "${entry.name}" to be running`).toBe(true);
      expect(registry.get(entry.name)).toBeDefined();
    }
  });

  it('reports a status for every catalog entry, matching real hosting outcomes', () => {
    const registry = new RuntimeRegistryService();
    registry.onModuleInit();

    const statuses = registry.statuses();
    expect(statuses).toHaveLength(ENGINE_CATALOG.length);

    for (const status of statuses) {
      if (!status.hosted) {
        expect(status.status).toBe('not-hosted');
        expect(status.reason).toBeTruthy();
      } else {
        expect(status.status).toBe('running');
      }
    }
  });

  it('wires api-gateway with its real sibling collaborators injected', () => {
    const registry = new RuntimeRegistryService();
    registry.onModuleInit();

    const gateway = registry.get<{
      discovery: unknown;
      authentication: unknown;
      authorization: unknown;
    }>('api-gateway');
    expect(gateway).toBeDefined();
    expect(gateway?.discovery).toBeDefined();
    expect(gateway?.authentication).toBeDefined();
    expect(gateway?.authorization).toBeDefined();
  });

  it('returns undefined for an unknown engine name without throwing', () => {
    const registry = new RuntimeRegistryService();
    registry.onModuleInit();
    expect(registry.get('not-a-real-engine')).toBeUndefined();
    expect(registry.has('not-a-real-engine')).toBe(false);
  });
});
