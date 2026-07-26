import { describe, expect, it } from 'vitest';
import { createWorkflowRuntime } from '../src/runtime.js';
import type { StepHandler } from '../src/execution/step-handler.js';
import type { ServiceTask } from '../src/step/types.js';
import type { Transition } from '../src/transition/types.js';

const ORG = 'org-1';

function serviceStep(stepId: string, code: string): ServiceTask {
  return {
    stepId,
    code,
    name: code,
    type: 'service',
    optional: false,
    serviceRef: 'svc://noop',
    operation: 'noop',
    inputVariableKeys: [],
  };
}

describe('WorkflowRuntime — sequential execution', () => {
  it('runs three steps in sequence and completes the instance', async () => {
    const calls: string[] = [];
    const handler: StepHandler = async (step) => {
      calls.push(step.code);
      return { success: true, output: { [`${step.code}_done`]: true } };
    };
    const runtime = createWorkflowRuntime({ stepHandlers: { service: handler } });

    const steps = [serviceStep('s1', 'collect'), serviceStep('s2', 'validate'), serviceStep('s3', 'archive')];
    const transitions: Transition[] = [
      { transitionId: 't1', fromStepId: 's1', toStepId: 's2', type: 'sequential' },
      { transitionId: 't2', fromStepId: 's2', toStepId: 's3', type: 'sequential' },
    ];

    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'onboarding',
      name: 'Onboarding',
      metadata: { category: 'onboarding' },
      version: '1.0.0',
      steps,
      transitions,
    });

    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    expect(calls).toEqual(['collect', 'validate', 'archive']);
    expect(instance.status).toBe('completed');
    expect(instance.variables).toMatchObject({ collect_done: true, validate_done: true, archive_done: true });
  });

  it('records execution and workflow history for every step', async () => {
    const handler: StepHandler = async () => ({ success: true });
    const runtime = createWorkflowRuntime({ stepHandlers: { service: handler } });

    const steps = [serviceStep('s1', 'a'), serviceStep('s2', 'b')];
    const transitions: Transition[] = [{ transitionId: 't1', fromStepId: 's1', toStepId: 's2', type: 'sequential' }];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'two-step',
      name: 'Two Step',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions,
    });
    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    const history = await runtime.queries.findHistory({ organizationId: ORG, instanceId: instance.id });
    const eventTypes = history.workflowHistory.map((entry) => entry.eventType);
    expect(eventTypes).toEqual(['instance_started', 'step_started', 'step_completed', 'step_started', 'step_completed', 'instance_completed']);
    expect(history.executionHistory).toHaveLength(2);
  });

  it('stops at a step with no registered handler, leaving it active for external completion', async () => {
    const runtime = createWorkflowRuntime(); // no handlers registered at all
    const steps = [serviceStep('s1', 'manual-step')];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'manual',
      name: 'Manual',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions: [],
    });

    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    expect(instance.status).toBe('running');

    const waiting = await runtime.queries.findWaitingTasks({ organizationId: ORG, instanceId: instance.id });
    // "active" (not "waiting") — no handler means the step is in progress externally, not blocked on a timer/approval.
    expect(waiting.stepInstances).toHaveLength(0);
  });
});
