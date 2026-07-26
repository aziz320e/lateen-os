import { describe, expect, it } from 'vitest';
import { createAgentRegistryRepository, createAgentRegistryService } from '@lateen-os/ai-runtime';
import { createBrainSystem } from '../src/brain.impl.js';
import { createBrainEventBus } from '../src/events/brain-event-bus.js';
import type { PlanValidator } from '../src/validation/validator.js';

const ORG = 'org-1';

function makeRequest(rawInput: string) {
  return { organizationId: ORG, sessionId: 'session-1', correlationId: 'corr-1', rawInput, actorId: 'user-1' };
}

describe('createBrainSystem / Brain.process', () => {
  it('accepts a business objective and returns a structured, approved execution plan', async () => {
    const { brain } = createBrainSystem();

    const response = await brain.process(makeRequest('Create a new product listing'));

    expect(response.intent.type).toBe('command');
    expect(response.reasoning.success).toBe(true);
    expect(response.plan.status).toBe('ready');
    expect(response.validation.approved).toBe(true);
    expect(response.executionRequested).toBe(true);
    expect(response.plan.graph.nodes.length).toBeGreaterThan(0);
  });

  it('exposes every capability port on the composed Brain', () => {
    const { brain } = createBrainSystem();
    expect(brain.capabilities.intentRecognizer).toBeDefined();
    expect(brain.capabilities.contextAssembler).toBeDefined();
    expect(brain.capabilities.workingMemory).toBeDefined();
    expect(brain.capabilities.reasoner).toBeDefined();
    expect(brain.capabilities.router).toBeDefined();
    expect(brain.capabilities.planner).toBeDefined();
    expect(brain.capabilities.validator).toBeDefined();
    expect(brain.capabilities.reflector).toBeDefined();
  });

  it('publishes the approved-session event sequence and no rejection event', async () => {
    const eventBus = createBrainEventBus();
    const published: string[] = [];
    eventBus.subscribeAll((name) => {
      published.push(name);
    });
    const { brain } = createBrainSystem({ eventBus });

    await brain.process(makeRequest('Create a new product listing'));

    expect(published).toEqual(['intent.recognized', 'reasoning.completed', 'plan.created', 'execution.requested']);
  });

  it('rejects the plan and requests no execution when the validator disapproves', async () => {
    const eventBus = createBrainEventBus();
    const published: string[] = [];
    eventBus.subscribeAll((name) => {
      published.push(name);
    });

    const rejectingValidator: PlanValidator = {
      async validate(input) {
        return {
          id: 'validation-forced',
          organizationId: input.organizationId,
          planId: input.plan.id,
          permission: { status: 'passed', checkedPermissions: [], violations: [] },
          policy: { status: 'passed', checkedPolicies: [], violations: [] },
          business: { status: 'failed', checkedRules: [], violations: ['forced rejection for testing'], warnings: [] },
          approved: false,
          validatedAt: '2026-01-01T00:00:00.000Z',
        };
      },
    };

    const { brain } = createBrainSystem({ eventBus, capabilities: { validator: rejectingValidator } });
    const response = await brain.process(makeRequest('Create a new product listing'));

    expect(response.plan.status).toBe('rejected');
    expect(response.plan.rejectionReason).toBe('forced rejection for testing');
    expect(response.executionRequested).toBe(false);
    expect(published).toContain('plan.rejected');
    expect(published).not.toContain('execution.requested');
  });

  it('genuinely invokes AI Runtime during routing when an agent registry is injected', async () => {
    const agentRegistry = createAgentRegistryService(createAgentRegistryRepository());
    await agentRegistry.register(ORG, {
      runtimeAgentId: 'runtime-agent-1',
      businessDnaAgentId: 'bdna-agent-1',
      profile: { displayName: 'Ops Agent', workforceType: 'operations_ai', proactiveEnabled: true, reactiveEnabled: true },
      registeredAt: '2026-01-01T00:00:00.000Z',
    });

    const { brain } = createBrainSystem({ agentRegistry });
    const response = await brain.process(makeRequest('Create a new product listing'));

    expect(response.plan.workerPlans[0]?.role).toBe('operations_ai');
    expect(response.plan.workerPlans[0]?.workerId).toBe('bdna-agent-1');
  });

  it('degrades gracefully for unrecognizable input: still returns a plan, but reasoning fails and reflection flags it', async () => {
    const { brain } = createBrainSystem();
    const response = await brain.process(makeRequest('purple elephants dance quietly'));

    expect(response.reasoning.success).toBe(false);
    expect(response.reflection.shouldRevise).toBe(true);
    expect(response.plan).toBeDefined();
  });
});
