import { describe, expect, it } from 'vitest';
import { createMultiAgentWorkflowRepository } from '../src/orchestrator/repository.impl.js';
import { createOrchestrator } from '../src/orchestrator/orchestrator.impl.js';
import { createRuntimeEventBus } from '../src/events/runtime-event-bus.js';
import type { MultiAgentWorkflow } from '../src/orchestrator/types.js';

const ORG = 'org-1';
const now = new Date().toISOString();

function makeWorkflow(): MultiAgentWorkflow {
  return {
    id: 'wf-1', organizationId: ORG, createdAt: now, updatedAt: now,
    name: 'Launch', coordinator: { leadAgentId: 'agent-1', participantAgentIds: [] }, planIds: [], status: 'draft',
  };
}

describe('createOrchestrator', () => {
  it('startWorkflow persists the workflow as running and returns its id', async () => {
    const repository = createMultiAgentWorkflowRepository();
    const orchestrator = createOrchestrator({ workflowRepository: repository });

    const id = await orchestrator.startWorkflow(ORG, makeWorkflow());
    expect(id).toBe('wf-1');
    const stored = await repository.findById(ORG, id);
    expect(stored?.status).toBe('running');
  });

  it('pauseWorkflow transitions running -> waiting', async () => {
    const repository = createMultiAgentWorkflowRepository();
    const orchestrator = createOrchestrator({ workflowRepository: repository });
    const id = await orchestrator.startWorkflow(ORG, makeWorkflow());

    await orchestrator.pauseWorkflow(ORG, id);
    const stored = await repository.findById(ORG, id);
    expect(stored?.status).toBe('waiting');
  });

  it('resumeWorkflow transitions waiting -> running', async () => {
    const repository = createMultiAgentWorkflowRepository();
    const orchestrator = createOrchestrator({ workflowRepository: repository });
    const id = await orchestrator.startWorkflow(ORG, makeWorkflow());
    await orchestrator.pauseWorkflow(ORG, id);

    await orchestrator.resumeWorkflow(ORG, id);
    const stored = await repository.findById(ORG, id);
    expect(stored?.status).toBe('running');
  });

  it('resumeWorkflow rejects a workflow that is not paused', async () => {
    const repository = createMultiAgentWorkflowRepository();
    const orchestrator = createOrchestrator({ workflowRepository: repository });
    const id = await orchestrator.startWorkflow(ORG, makeWorkflow());

    await expect(orchestrator.resumeWorkflow(ORG, id)).rejects.toThrow(/not paused/);
  });

  it('cancelWorkflow transitions to cancelled', async () => {
    const repository = createMultiAgentWorkflowRepository();
    const orchestrator = createOrchestrator({ workflowRepository: repository });
    const id = await orchestrator.startWorkflow(ORG, makeWorkflow());

    await orchestrator.cancelWorkflow(ORG, id);
    const stored = await repository.findById(ORG, id);
    expect(stored?.status).toBe('cancelled');
  });

  it('publishes real domain events for each transition', async () => {
    const repository = createMultiAgentWorkflowRepository();
    const eventBus = createRuntimeEventBus();
    const events: string[] = [];
    eventBus.subscribeAll((name) => events.push(name));

    const orchestrator = createOrchestrator({ workflowRepository: repository, eventBus });
    const id = await orchestrator.startWorkflow(ORG, makeWorkflow());
    await orchestrator.pauseWorkflow(ORG, id);
    await orchestrator.resumeWorkflow(ORG, id);
    await orchestrator.cancelWorkflow(ORG, id);

    expect(events).toEqual([
      'orchestration.started',
      'orchestration.paused',
      'orchestration.resumed',
      'orchestration.cancelled',
    ]);
  });
});
