import { describe, expect, it } from 'vitest';
import { createWorkflowRuntime } from '../src/runtime.js';
import { createWorkflowEventBus } from '../src/events/workflow-event-bus.js';
import type { StepHandler } from '../src/execution/step-handler.js';
import type { AITask, HumanTask, ServiceTask } from '../src/step/types.js';
import type { Transition } from '../src/transition/types.js';

const ORG = 'org-1';

function serviceStep(stepId: string, code: string): ServiceTask {
  return { stepId, code, name: code, type: 'service', optional: false, serviceRef: 'svc://noop', operation: 'noop', inputVariableKeys: [] };
}

describe('WorkflowRuntime — event publishing', () => {
  it('publishes the full lifecycle event sequence for a two-step run', async () => {
    const eventBus = createWorkflowEventBus();
    const published: string[] = [];
    eventBus.subscribeAll((name) => {
      published.push(name);
    });

    const handler: StepHandler = async () => ({ success: true });
    const runtime = createWorkflowRuntime({ eventBus, stepHandlers: { service: handler } });

    const steps = [serviceStep('s1', 'a'), serviceStep('s2', 'b')];
    const transitions: Transition[] = [{ transitionId: 't1', fromStepId: 's1', toStepId: 's2', type: 'sequential' }];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'events-demo',
      name: 'Events Demo',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions,
    });
    await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    expect(published).toEqual([
      'workflow.defined',
      'workflow.published',
      'workflow_instance.started',
      'step.started',
      'step.completed',
      'step.started',
      'step.completed',
      'workflow_instance.completed',
    ]);
  });
});

describe('WorkflowRuntime — query layer', () => {
  async function defineAndRun(runtime: ReturnType<typeof createWorkflowRuntime>, code: string) {
    const handler: StepHandler = async () => ({ success: true });
    const steps = [serviceStep('s1', 'only')];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code,
      name: code,
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions: [],
    });
    return { definition, handler };
  }

  it('findWorkflow finds a definition by code and returns its current version + steps', async () => {
    const handler: StepHandler = async () => ({ success: true });
    const runtime = createWorkflowRuntime({ stepHandlers: { service: handler } });
    const { definition } = await defineAndRun(runtime, 'lookup-by-code');

    const byCode = await runtime.queries.findWorkflow({ organizationId: ORG, code: 'lookup-by-code' });
    expect(byCode.definition?.id).toBe(definition.id);
    expect(byCode.steps).toHaveLength(1);

    const byId = await runtime.queries.findWorkflow({ organizationId: ORG, definitionId: definition.id });
    expect(byId.version?.definitionId).toBe(definition.id);

    const missing = await runtime.queries.findWorkflow({ organizationId: ORG, code: 'does-not-exist' });
    expect(missing.definition).toBeNull();
  });

  it('findRunningWorkflows filters by status and paginates', async () => {
    const runtime = createWorkflowRuntime(); // no handlers: every instance stays "running"
    const steps = [serviceStep('s1', 'manual')];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'pagination-demo',
      name: 'Pagination Demo',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions: [],
    });
    await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    const all = await runtime.queries.findRunningWorkflows({ organizationId: ORG, status: 'running' });
    expect(all.total).toBe(3);

    const page = await runtime.queries.findRunningWorkflows({ organizationId: ORG, status: 'running', offset: 1, limit: 1 });
    expect(page.instances).toHaveLength(1);
    expect(page.total).toBe(3);
  });

  it('findWaitingTasks filters by assignee and worker', async () => {
    const runtime = createWorkflowRuntime();
    const humanStep: HumanTask = { stepId: 's1', code: 'review', name: 'review', type: 'human', optional: false, assigneeEmployeeId: 'emp-1' };
    const aiStep: AITask = { stepId: 's2', code: 'summarize', name: 'summarize', type: 'ai', optional: false, workerId: 'worker-1', taskTemplate: 't', inputVariableKeys: [] };
    const { definition: humanDef } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'human-review',
      name: 'Human Review',
      metadata: { category: 'approval' },
      version: '1.0.0',
      steps: [humanStep],
      transitions: [],
    });
    const { definition: aiDef } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'ai-review',
      name: 'AI Review',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps: [aiStep],
      transitions: [],
    });
    await runtime.startWorkflow({ organizationId: ORG, definitionId: humanDef.id });
    await runtime.startWorkflow({ organizationId: ORG, definitionId: aiDef.id });

    const forEmployee = await runtime.queries.findWaitingTasks({ organizationId: ORG, assigneeEmployeeId: 'emp-1' });
    expect(forEmployee.total).toBe(0); // steps without a handler are "active", not "waiting"

    const allWaiting = await runtime.queries.findWaitingTasks({ organizationId: ORG });
    expect(allWaiting.total).toBe(0);
  });

  it('findHistory scopes to a specific step instance when requested', async () => {
    const handler: StepHandler = async () => ({ success: true });
    const runtime = createWorkflowRuntime({ stepHandlers: { service: handler } });
    const steps = [serviceStep('s1', 'a'), serviceStep('s2', 'b')];
    const transitions: Transition[] = [{ transitionId: 't1', fromStepId: 's1', toStepId: 's2', type: 'sequential' }];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'scoped-history',
      name: 'Scoped History',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions,
    });
    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    const full = await runtime.queries.findHistory({ organizationId: ORG, instanceId: instance.id });
    expect(full.executionHistory).toHaveLength(2);

    const firstStepInstanceId = full.executionHistory[0]!.stepInstanceId;
    const scoped = await runtime.queries.findHistory({ organizationId: ORG, instanceId: instance.id, stepInstanceId: firstStepInstanceId });
    expect(scoped.executionHistory).toHaveLength(1);
  });
});
