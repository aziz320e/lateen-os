import { describe, expect, it } from 'vitest';
import { createWorkflowRuntime } from '../src/runtime.js';
import type { StepHandler } from '../src/execution/step-handler.js';
import type { ServiceTask } from '../src/step/types.js';
import type { ParallelTransition, Transition } from '../src/transition/types.js';

const ORG = 'org-1';

function serviceStep(stepId: string, code: string): ServiceTask {
  return { stepId, code, name: code, type: 'service', optional: false, serviceRef: 'svc://noop', operation: 'noop', inputVariableKeys: [] };
}

describe('WorkflowRuntime — parallel execution', () => {
  it('forks into concurrent branches and joins once all complete', async () => {
    const order: string[] = [];
    const handler: StepHandler = async (step) => {
      order.push(step.code);
      return { success: true, output: { [`${step.code}_done`]: true } };
    };
    const runtime = createWorkflowRuntime({ stepHandlers: { service: handler } });

    const steps = [
      serviceStep('start', 'start'),
      serviceStep('branch-a', 'checkInventory'),
      serviceStep('branch-b', 'checkCredit'),
      serviceStep('join', 'confirmOrder'),
    ];
    const fork: ParallelTransition = {
      transitionId: 't1',
      fromStepId: 'start',
      toStepId: 'join',
      type: 'parallel',
      fork: true,
      branchStepIds: ['branch-a', 'branch-b'],
      joinRequiredCount: 2,
    };
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'parallel-checks',
      name: 'Parallel Checks',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions: [fork],
    });

    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    expect(instance.status).toBe('completed');
    expect(order[0]).toBe('start');
    expect(order.slice(1, 3).sort()).toEqual(['checkCredit', 'checkInventory']);
    expect(order[3]).toBe('confirmOrder');
    expect(instance.variables).toMatchObject({ checkInventory_done: true, checkCredit_done: true, confirmOrder_done: true });
  });

  it('waits for joinRequiredCount branches before proceeding to the join step', async () => {
    const runtime = createWorkflowRuntime(); // no handlers — branches complete manually
    const steps = [serviceStep('start', 'start'), serviceStep('branch-a', 'a'), serviceStep('branch-b', 'b'), serviceStep('join', 'join')];
    const fork: ParallelTransition = {
      transitionId: 't1',
      fromStepId: 'start',
      toStepId: 'join',
      type: 'parallel',
      fork: true,
      branchStepIds: ['branch-a', 'branch-b'],
      joinRequiredCount: 2,
    };
    // start has no handler, so it must be manually started via dispatch too — model "start" as the first step.
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'manual-fork',
      name: 'Manual Fork',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions: [fork],
    });
    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    await runtime.orchestrator.dispatch({ organizationId: ORG, instanceId: instance.id, stepId: 'start', command: 'complete', issuedAt: '2026-01-01T00:01:00.000Z' });

    const waitingAfterFork = await runtime.queries.findRunningWorkflows({ organizationId: ORG, status: 'running' });
    expect(waitingAfterFork.instances).toHaveLength(1);

    await runtime.orchestrator.dispatch({ organizationId: ORG, instanceId: instance.id, stepId: 'branch-a', command: 'complete', issuedAt: '2026-01-01T00:02:00.000Z' });

    // Only one of two branches done — join must not have started yet.
    const history = await runtime.queries.findHistory({ organizationId: ORG, instanceId: instance.id });
    expect(history.workflowHistory.some((entry) => entry.stepId === 'join')).toBe(false);

    const handoff = await runtime.orchestrator.dispatch({ organizationId: ORG, instanceId: instance.id, stepId: 'branch-b', command: 'complete', issuedAt: '2026-01-01T00:03:00.000Z' });
    expect(handoff.status).toBe('completed');

    const historyAfterJoin = await runtime.queries.findHistory({ organizationId: ORG, instanceId: instance.id });
    expect(historyAfterJoin.workflowHistory.some((entry) => entry.stepId === 'join')).toBe(true);
  });
});
