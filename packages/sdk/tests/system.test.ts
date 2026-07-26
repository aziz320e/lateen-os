import { describe, expect, it } from 'vitest';
import {
  createBrainFacade,
  createCEO,
  createDecisionEngineFacade,
  createIntelligenceEngineFacade,
  createLateen,
  createProviderHub,
  createRuntimeFacade,
  ProviderNotConfiguredError,
} from '../src/system/index.js';

const ORG = 'org-1';

describe('createProviderHub', () => {
  it('constructs with zero config', () => {
    const hub = createProviderHub();
    expect(hub.capabilities.registry).toBeDefined();
    expect(hub.capabilities.queries).toBeDefined();
  });

  it('throws ProviderNotConfiguredError when an unconfigured chat capability is invoked', async () => {
    const hub = createProviderHub();
    await expect(
      hub.capabilities.chat.complete({ modelId: 'gpt-4', messages: [], stream: false }),
    ).rejects.toBeInstanceOf(ProviderNotConfiguredError);
  });

  it('uses an injected chat provider instead of the stub', async () => {
    const hub = createProviderHub({
      chat: {
        async complete() {
          return {
            requestId: 'req-1',
            providerId: 'test-provider',
            modelId: 'gpt-4',
            content: 'hello',
            promptTokens: 1,
            completionTokens: 1,
            latencyMs: 1,
            finishReason: 'stop',
          };
        },
        stream() {
          throw new Error('not used in this test');
        },
      },
    });

    const result = await hub.capabilities.chat.complete({ modelId: 'gpt-4', messages: [], stream: false });
    expect(result.content).toBe('hello');
  });
});

describe('createDecisionEngineFacade', () => {
  it('exposes a real reasoner and a working query layer', async () => {
    const decisionEngine = createDecisionEngineFacade();
    expect(decisionEngine.reasoner).toBeDefined();

    const pending = await decisionEngine.queries.findPendingApprovals({ organizationId: ORG });
    expect(pending.flows).toEqual([]);
  });
});

describe('createIntelligenceEngineFacade', () => {
  it('exposes real scoring/ranking/forecasting/recommendation and a working query layer', async () => {
    const intelligenceEngine = createIntelligenceEngineFacade();
    expect(intelligenceEngine.scorer).toBeDefined();
    expect(intelligenceEngine.ranker).toBeDefined();
    expect(intelligenceEngine.forecaster).toBeDefined();
    expect(intelligenceEngine.recommender).toBeDefined();

    const trending = await intelligenceEngine.queries.findTrendingProducts({ organizationId: ORG });
    expect(trending.products).toEqual([]);
  });

  it('creates and ranks a recommendation candidate deterministically', () => {
    const { recommender } = createIntelligenceEngineFacade();
    const candidate = recommender.createCandidate({
      organizationId: ORG,
      title: 'Expand into new market',
      summary: 'Enter the packaging segment',
      proposedAction: 'launch',
      decisionCategory: 'strategic',
      score: '0.80',
    });
    const [ranked] = recommender.rankCandidates([candidate]);
    expect(ranked?.status).toBe('ranked');
  });
});

describe('createRuntimeFacade', () => {
  function unconfiguredChat() {
    return {
      async complete(): Promise<never> {
        throw new Error('not configured for this test');
      },
      stream(): never {
        throw new Error('not configured for this test');
      },
    };
  }

  it('exposes a real agent registry, task queue, orchestrator, and query layer', async () => {
    const runtime = createRuntimeFacade({ chatProvider: unconfiguredChat() });

    await runtime.agentRegistry.register(ORG, {
      runtimeAgentId: 'runtime-agent-1',
      businessDnaAgentId: 'bdna-agent-1',
      profile: { displayName: 'Ops Agent', workforceType: 'operations_ai', proactiveEnabled: true, reactiveEnabled: true },
      registeredAt: '2026-01-01T00:00:00.000Z',
    });

    const registry = await runtime.agentRegistry.getRegistry(ORG);
    expect(registry.registrations).toHaveLength(1);

    const agents = await runtime.queries.findAgent({ organizationId: ORG });
    expect(agents).toBeDefined();
  });
});

describe('createBrainFacade', () => {
  it('processes a business objective and can later explain the resulting plan', async () => {
    const brain = createBrainFacade();
    const response = await brain.process({
      organizationId: ORG,
      sessionId: 'session-1',
      correlationId: 'corr-1',
      rawInput: 'Create a new product listing',
      actorId: 'user-1',
    });

    expect(response.plan.status).toBe('ready');
    const explanation = await brain.queries.explainPlan({ organizationId: ORG, planId: response.plan.id });
    expect(explanation.plan.id).toBe(response.plan.id);
  });
});

describe('createCEO', () => {
  it('submits and dispatches a mission', async () => {
    const ceo = createCEO();
    const mission = await ceo.submitMission({
      organizationId: ORG,
      title: 'Grow organic traffic',
      description: 'Improve SEO rankings',
      priority: 'high',
    });
    const tasks = await ceo.dispatchMission(ORG, mission.id);
    expect(tasks.length).toBeGreaterThan(0);
  });
});

describe('createLateen', () => {
  it('wires every engine facade and the client into one LateenSystem', () => {
    const system = createLateen();
    expect(system.providerHub).toBeDefined();
    expect(system.decisionEngine).toBeDefined();
    expect(system.intelligenceEngine).toBeDefined();
    expect(system.runtime).toBeDefined();
    expect(system.brain).toBeDefined();
    expect(system.ceo).toBeDefined();
    expect(system.client).toBeDefined();
  });

  it('genuinely wires Runtime into Brain: an agent registered on runtime is routed to by brain.process()', async () => {
    const system = createLateen();
    await system.runtime.agentRegistry.register(ORG, {
      runtimeAgentId: 'runtime-agent-1',
      businessDnaAgentId: 'bdna-agent-1',
      profile: { displayName: 'Ops Agent', workforceType: 'operations_ai', proactiveEnabled: true, reactiveEnabled: true },
      registeredAt: '2026-01-01T00:00:00.000Z',
    });

    const response = await system.brain.process({
      organizationId: ORG,
      sessionId: 'session-1',
      correlationId: 'corr-1',
      rawInput: 'Create a new product listing',
      actorId: 'user-1',
    });

    expect(response.plan.workerPlans[0]?.role).toBe('operations_ai');
  });

  it('the client exposes only read-oriented CEO methods, not mission mutation', () => {
    const system = createLateen();
    expect(system.client.ceo.getMission).toBeDefined();
    expect(system.client.ceo.listMissions).toBeDefined();
    expect((system.client.ceo as Record<string, unknown>).submitMission).toBeUndefined();
    expect((system.client.ceo as Record<string, unknown>).dispatchMission).toBeUndefined();
  });

  it('the client surfaces every engine query interface', async () => {
    const system = createLateen();
    expect(system.client.decisions).toBeDefined();
    expect(system.client.intelligence).toBeDefined();
    expect(system.client.providers).toBeDefined();
    expect(system.client.runtime.queries).toBeDefined();
    expect(system.client.brain.queries).toBeDefined();

    await expect(system.client.decisions.findPendingApprovals({ organizationId: ORG })).resolves.toEqual({ flows: [] });
  });
});
