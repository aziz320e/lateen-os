import { describe, expect, it } from 'vitest';
import { createAgentRegistryRepository, createAgentRegistryService } from '@lateen-os/ai-runtime';
import { createMultiAgentRuntime } from '../src/runtime.js';
import { AgentNotRegisteredError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('Integration: registerAgent + real AI Runtime AgentRegistryService', () => {
  it('succeeds when the referenced runtimeAgentId is genuinely registered in AI Runtime', async () => {
    const runtimeAgentRegistry = createAgentRegistryService(createAgentRegistryRepository());
    await runtimeAgentRegistry.register(ORG, {
      runtimeAgentId: 'runtime-agent-1',
      businessDnaAgentId: 'bdna-1',
      profile: { displayName: 'Sales Agent', workforceType: 'sales_ai', proactiveEnabled: true, reactiveEnabled: true },
      registeredAt: '2026-01-01T00:00:00.000Z',
    });

    const runtime = createMultiAgentRuntime({ runtimeAgentRegistry });
    const registration = await runtime.registerAgent(ORG, {
      workerId: 'sales-worker',
      runtimeAgentId: 'runtime-agent-1',
      role: 'sales_ai',
      capabilities: [],
      displayName: 'Sales Worker',
    });

    expect(registration.active).toBe(true);
    expect(await runtime.agentRegistry.findByWorkerId(ORG, 'sales-worker')).not.toBeNull();
  });

  it('throws AgentNotRegisteredError when the referenced runtimeAgentId is not actually registered in AI Runtime', async () => {
    const runtimeAgentRegistry = createAgentRegistryService(createAgentRegistryRepository());
    const runtime = createMultiAgentRuntime({ runtimeAgentRegistry });

    await expect(
      runtime.registerAgent(ORG, {
        workerId: 'sales-worker',
        runtimeAgentId: 'nonexistent-runtime-agent',
        role: 'sales_ai',
        capabilities: [],
        displayName: 'Sales Worker',
      }),
    ).rejects.toBeInstanceOf(AgentNotRegisteredError);
  });

  it('registers without cross-validation when no runtimeAgentId is on the descriptor', async () => {
    const runtimeAgentRegistry = createAgentRegistryService(createAgentRegistryRepository());
    const runtime = createMultiAgentRuntime({ runtimeAgentRegistry });

    const registration = await runtime.registerAgent(ORG, {
      workerId: 'hr-worker',
      role: 'hr_ai',
      capabilities: [],
      displayName: 'HR Worker',
    });
    expect(registration.active).toBe(true);
  });

  it('registers without cross-validation when no runtimeAgentRegistry is injected at all', async () => {
    const runtime = createMultiAgentRuntime();
    const registration = await runtime.registerAgent(ORG, {
      workerId: 'finance-worker',
      runtimeAgentId: 'anything',
      role: 'finance_ai',
      capabilities: [],
      displayName: 'Finance Worker',
    });
    expect(registration.active).toBe(true);
  });
});
