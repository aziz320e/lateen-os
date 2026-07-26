import { describe, expect, it } from 'vitest';
import { createAgentRegistrationRepository } from '../src/agent/repository.impl.js';
import { createAgentRegistry } from '../src/agent/registry.impl.js';
import { createAgentDirectory, createAgentDiscovery } from '../src/agent/directory.impl.js';
import { AgentNotRegisteredError, NoSuitableAgentError } from '../src/shared/errors.js';

const ORG = 'org-1';

function descriptor(workerId: string, role: 'sales_ai' | 'finance_ai' = 'sales_ai', capabilities: string[] = []) {
  return { workerId, role, capabilities, displayName: workerId };
}

describe('AgentRegistry', () => {
  it('registers a new agent as available and active', async () => {
    const registry = createAgentRegistry(createAgentRegistrationRepository());
    const registration = await registry.register(ORG, descriptor('worker-1'));
    expect(registration.active).toBe(true);
    expect(registration.availability).toBe('available');
  });

  it('re-registering the same worker reactivates rather than duplicating', async () => {
    const repository = createAgentRegistrationRepository();
    const registry = createAgentRegistry(repository);
    await registry.register(ORG, descriptor('worker-1'));
    await registry.deactivate(ORG, 'worker-1');
    await registry.register(ORG, descriptor('worker-1'));

    const all = await registry.list(ORG);
    expect(all).toHaveLength(1);
    expect(all[0]?.active).toBe(true);
  });

  it('setAvailability updates an existing registration', async () => {
    const registry = createAgentRegistry(createAgentRegistrationRepository());
    await registry.register(ORG, descriptor('worker-1'));
    const updated = await registry.setAvailability(ORG, 'worker-1', 'busy');
    expect(updated.availability).toBe('busy');
  });

  it('throws AgentNotRegisteredError for an unknown worker', async () => {
    const registry = createAgentRegistry(createAgentRegistrationRepository());
    await expect(registry.deactivate(ORG, 'missing')).rejects.toBeInstanceOf(AgentNotRegisteredError);
  });
});

describe('AgentDirectory', () => {
  it('findByRole and findByCapability filter active registrations', async () => {
    const registry = createAgentRegistry(createAgentRegistrationRepository());
    await registry.register(ORG, descriptor('worker-1', 'sales_ai', ['negotiation']));
    await registry.register(ORG, descriptor('worker-2', 'finance_ai', ['forecasting']));

    const directory = createAgentDirectory(registry);
    expect(await directory.findByRole(ORG, 'sales_ai')).toHaveLength(1);
    expect(await directory.findByCapability(ORG, 'forecasting')).toHaveLength(1);
  });

  it('findAvailable excludes deactivated agents', async () => {
    const registry = createAgentRegistry(createAgentRegistrationRepository());
    await registry.register(ORG, descriptor('worker-1'));
    await registry.register(ORG, descriptor('worker-2'));
    await registry.deactivate(ORG, 'worker-2');

    const directory = createAgentDirectory(registry);
    expect(await directory.findAvailable(ORG)).toHaveLength(1);
  });
});

describe('AgentDiscovery', () => {
  it('discovers the earliest-registered available agent for a role', async () => {
    const registry = createAgentRegistry(createAgentRegistrationRepository());
    await registry.register(ORG, descriptor('worker-1', 'sales_ai'));
    await registry.register(ORG, descriptor('worker-2', 'sales_ai'));

    const discovery = createAgentDiscovery(createAgentDirectory(registry));
    const found = await discovery.discover(ORG, 'sales_ai');
    expect(found.descriptor.workerId).toBe('worker-1');
  });

  it('respects a required capability', async () => {
    const registry = createAgentRegistry(createAgentRegistrationRepository());
    await registry.register(ORG, descriptor('worker-1', 'sales_ai', []));
    await registry.register(ORG, descriptor('worker-2', 'sales_ai', ['enterprise-negotiation']));

    const discovery = createAgentDiscovery(createAgentDirectory(registry));
    const found = await discovery.discover(ORG, 'sales_ai', 'enterprise-negotiation');
    expect(found.descriptor.workerId).toBe('worker-2');
  });

  it('throws NoSuitableAgentError when nobody matches', async () => {
    const registry = createAgentRegistry(createAgentRegistrationRepository());
    const discovery = createAgentDiscovery(createAgentDirectory(registry));
    await expect(discovery.discover(ORG, 'hr_ai')).rejects.toBeInstanceOf(NoSuitableAgentError);
  });

  it('skips busy agents', async () => {
    const registry = createAgentRegistry(createAgentRegistrationRepository());
    await registry.register(ORG, descriptor('worker-1', 'sales_ai'));
    await registry.setAvailability(ORG, 'worker-1', 'busy');

    const discovery = createAgentDiscovery(createAgentDirectory(registry));
    await expect(discovery.discover(ORG, 'sales_ai')).rejects.toBeInstanceOf(NoSuitableAgentError);
  });
});
