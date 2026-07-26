import { describe, expect, it } from 'vitest';
import { createAgentRegistryRepository, createAgentRegistryService } from '@lateen-os/ai-runtime';
import { createEnterpriseContextAssembler } from '../src/context/assembler.impl.js';
import { createIntentRecognizer } from '../src/intent/recognizer.impl.js';
import { createWorkingMemory } from '../src/memory/working-memory.impl.js';
import { createEnterpriseReasoner } from '../src/reasoning/reasoner.impl.js';
import { createPlatformRouter } from '../src/routing/router.impl.js';

const ORG = 'org-1';
const SESSION = 'session-1';
const CORRELATION = 'corr-1';

async function reasoningResultFor(rawInput: string) {
  const intent = await createIntentRecognizer().recognize({ organizationId: ORG, sessionId: SESSION, rawInput });
  const context = await createEnterpriseContextAssembler().assemble({
    organizationId: ORG,
    sessionId: SESSION,
    correlationId: CORRELATION,
    intent,
  });
  return createEnterpriseReasoner({ workingMemory: createWorkingMemory() }).reason({
    organizationId: ORG,
    sessionId: 'reasoning-1',
    intent,
    context,
  });
}

describe('createPlatformRouter', () => {
  it('always produces at least one worker route, even with no agent registry injected', async () => {
    const reasoningResult = await reasoningResultFor('Create a product');
    const router = createPlatformRouter();

    const decision = await router.route({ organizationId: ORG, reasoningResult });
    expect(decision.workerRoutes).toHaveLength(1);
    expect(decision.workerRoutes[0]?.role).toBe('generalist');
  });

  it('adds a mission route for mission-like intents', async () => {
    const reasoningResult = await reasoningResultFor('Start a mission to expand into a new market');
    const router = createPlatformRouter();

    const decision = await router.route({ organizationId: ORG, reasoningResult });
    expect(decision.missionRoutes).toHaveLength(1);
    expect(decision.missionRoutes[0]?.missionType).toBe('mission');
  });

  it('adds a workflow route for workflow intents', async () => {
    const reasoningResult = await reasoningResultFor('Update the onboarding workflow');
    const router = createPlatformRouter();

    const decision = await router.route({ organizationId: ORG, reasoningResult });
    expect(decision.workflowRoutes).toHaveLength(1);
  });

  it('adds a service route for decision intents', async () => {
    const reasoningResult = await reasoningResultFor('Decide whether to approve this budget');
    const router = createPlatformRouter();

    const decision = await router.route({ organizationId: ORG, reasoningResult });
    expect(decision.serviceRoutes).toHaveLength(1);
    expect(decision.serviceRoutes[0]?.serviceName).toBe('decision-engine');
  });

  it('genuinely invokes AI Runtime: routes worker plans to a real registered runtime agent', async () => {
    const registry = createAgentRegistryService(createAgentRegistryRepository());
    await registry.register(ORG, {
      runtimeAgentId: 'runtime-agent-1',
      businessDnaAgentId: 'bdna-agent-1',
      profile: { displayName: 'Ops Agent', workforceType: 'operations_ai', proactiveEnabled: true, reactiveEnabled: true },
      registeredAt: '2026-01-01T00:00:00.000Z',
    });

    const reasoningResult = await reasoningResultFor('Create a product');
    const router = createPlatformRouter({ agentRegistry: registry });

    const decision = await router.route({ organizationId: ORG, reasoningResult });
    expect(decision.workerRoutes[0]?.workerId).toBe('bdna-agent-1');
    expect(decision.workerRoutes[0]?.role).toBe('operations_ai');
    expect(decision.workerRoutes[0]?.rationale).toContain('runtime-agent-1');
  });

  it('falls back to a generalist worker when the registry has no active registrations', async () => {
    const registry = createAgentRegistryService(createAgentRegistryRepository());
    const reasoningResult = await reasoningResultFor('Create a product');
    const router = createPlatformRouter({ agentRegistry: registry });

    const decision = await router.route({ organizationId: ORG, reasoningResult });
    expect(decision.workerRoutes[0]?.role).toBe('generalist');
  });
});
