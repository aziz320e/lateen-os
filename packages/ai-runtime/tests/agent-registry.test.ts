import { describe, expect, it } from 'vitest';
import { createAgentRegistryRepository } from '../src/registry/repository.impl.js';
import { createAgentRegistryService } from '../src/registry/agent-registry.impl.js';
import type { AgentDescriptor } from '../src/registry/types.js';

const ORG = 'org-1';

function makeDescriptor(runtimeAgentId: string): AgentDescriptor {
  return {
    runtimeAgentId,
    businessDnaAgentId: 'bdna-1',
    profile: { displayName: 'Agent', workforceType: 'ceo_ai', proactiveEnabled: true, reactiveEnabled: true },
    registeredAt: new Date().toISOString(),
  };
}

describe('createAgentRegistryService', () => {
  it('getRegistry returns an empty registry when none exists yet', async () => {
    const service = createAgentRegistryService(createAgentRegistryRepository());
    const registry = await service.getRegistry(ORG);
    expect(registry.registrations).toEqual([]);
    expect(registry.version).toBe(0);
  });

  it('register appends a new registration and increments version', async () => {
    const service = createAgentRegistryService(createAgentRegistryRepository());
    const registration = await service.register(ORG, makeDescriptor('agent-1'));
    expect(registration.active).toBe(true);

    const registry = await service.getRegistry(ORG);
    expect(registry.registrations).toHaveLength(1);
    expect(registry.version).toBe(1);
  });

  it('deactivate marks the matching registration inactive without removing it', async () => {
    const service = createAgentRegistryService(createAgentRegistryRepository());
    await service.register(ORG, makeDescriptor('agent-1'));
    await service.deactivate(ORG, 'agent-1');

    const registry = await service.getRegistry(ORG);
    expect(registry.registrations).toHaveLength(1);
    expect(registry.registrations[0]!.active).toBe(false);
  });

  it('the repository findByBusinessDnaAgentId reflects registered agents', async () => {
    const repository = createAgentRegistryRepository();
    const service = createAgentRegistryService(repository);
    await service.register(ORG, makeDescriptor('agent-1'));

    await expect(repository.findByBusinessDnaAgentId(ORG, 'bdna-1')).resolves.not.toBeNull();
    await expect(repository.findByBusinessDnaAgentId(ORG, 'unknown')).resolves.toBeNull();
  });
});
