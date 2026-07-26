import { describe, expect, it } from 'vitest';
import type { StreamingChatProvider } from '@lateen-os/ai-provider-hub';
import { createStructuredOutputProvider } from '@lateen-os/ai-provider-hub';
import { createTaskRepository } from '../src/task/repository.impl.js';
import { createPlanRepository } from '../src/planner/repository.impl.js';
import { createPlanner } from '../src/planner/planner.impl.js';
import type { Task } from '../src/task/types.js';

const ORG = 'org-1';
const now = new Date().toISOString();

function makeTask(): Task {
  return {
    id: 'task-1', organizationId: ORG, createdAt: now, updatedAt: now,
    title: 'Launch product', description: 'Bring the new SKU to market', runtimeAgentId: 'agent-1',
    priority: 'high', status: 'queued',
  };
}

function fakeChatProvider(content: string): StreamingChatProvider {
  return {
    complete: async () => ({ requestId: 'r', providerId: 'fake', modelId: 'm', content, promptTokens: 1, completionTokens: 1, latencyMs: 1, finishReason: 'stop' }),
    stream: async function* () {},
  };
}

describe('createPlanner without a chat provider', () => {
  it('createPlan falls back to a deterministic single-step plan', async () => {
    const taskRepository = createTaskRepository([makeTask()]);
    const planner = createPlanner({ planRepository: createPlanRepository(), taskRepository });

    const plan = await planner.createPlan(ORG, 'task-1');
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]!.label).toContain('Launch product');
  });

  it('createPlan throws PlanningError for an unknown task', async () => {
    const planner = createPlanner({ planRepository: createPlanRepository(), taskRepository: createTaskRepository() });
    await expect(planner.createPlan(ORG, 'missing')).rejects.toThrow(/not found/);
  });
});

describe('createPlanner with a chat provider', () => {
  it('createPlan uses the LLM-produced structured steps when valid JSON is returned', async () => {
    const taskRepository = createTaskRepository([makeTask()]);
    const chatProvider = fakeChatProvider(JSON.stringify({ steps: [{ label: 'Research market' }, { label: 'Build SKU' }] }));
    const planner = createPlanner({
      planRepository: createPlanRepository(),
      taskRepository,
      chatProvider,
      structuredOutput: createStructuredOutputProvider(),
      modelId: 'fake-model',
    });

    const plan = await planner.createPlan(ORG, 'task-1');
    expect(plan.steps).toHaveLength(2);
    expect(plan.steps[0]!.label).toBe('Research market');
    expect(plan.steps[1]!.order).toBe(2);
  });

  it('createPlan falls back to deterministic steps when the model returns invalid JSON', async () => {
    const taskRepository = createTaskRepository([makeTask()]);
    const chatProvider = fakeChatProvider('not json at all');
    const planner = createPlanner({
      planRepository: createPlanRepository(),
      taskRepository,
      chatProvider,
      structuredOutput: createStructuredOutputProvider(),
      modelId: 'fake-model',
    });

    const plan = await planner.createPlan(ORG, 'task-1');
    expect(plan.steps).toHaveLength(1);
  });

  it('refinePlan regenerates steps for an existing plan', async () => {
    const taskRepository = createTaskRepository([makeTask()]);
    const planRepository = createPlanRepository();
    const planner = createPlanner({ planRepository, taskRepository });

    const original = await planner.createPlan(ORG, 'task-1');
    const refined = await planner.refinePlan(ORG, original.id);
    expect(refined.id).toBe(original.id);
    expect(refined.steps.length).toBeGreaterThan(0);
  });

  it('refinePlan throws PlanningError for an unknown plan', async () => {
    const planner = createPlanner({ planRepository: createPlanRepository(), taskRepository: createTaskRepository() });
    await expect(planner.refinePlan(ORG, 'missing')).rejects.toThrow(/not found/);
  });
});
