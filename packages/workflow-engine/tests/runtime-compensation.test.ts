import { describe, expect, it } from 'vitest';
import { createWorkflowRuntime } from '../src/runtime.js';
import type { StepHandler } from '../src/execution/step-handler.js';
import type { ServiceTask } from '../src/step/types.js';
import type { Transition } from '../src/transition/types.js';

const ORG = 'org-1';

function serviceStep(stepId: string, code: string, compensationStepId?: string): ServiceTask {
  return {
    stepId,
    code,
    name: code,
    type: 'service',
    optional: false,
    serviceRef: 'svc://noop',
    operation: 'noop',
    inputVariableKeys: [],
    compensationStepId,
  };
}

describe('WorkflowRuntime — compensation support', () => {
  it('runs compensation in reverse order for completed steps when a later step fails irrecoverably', async () => {
    const calls: string[] = [];
    const handler: StepHandler = async (step) => {
      calls.push(step.code);
      if (step.code === 'chargeCard') {
        return { success: false, errorMessage: 'card declined' };
      }
      return { success: true };
    };
    const runtime = createWorkflowRuntime({ stepHandlers: { service: handler } });

    const steps = [
      serviceStep('s1', 'reserveInventory', 'c1'),
      serviceStep('s2', 'chargeCard'), // no retryPolicy -> single attempt, fails
      serviceStep('c1', 'releaseInventory'), // compensation for reserveInventory
    ];
    const transitions: Transition[] = [{ transitionId: 't1', fromStepId: 's1', toStepId: 's2', type: 'sequential' }];

    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'order-flow',
      name: 'Order Flow',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions,
    });

    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    expect(instance.status).toBe('failed');
    expect(calls).toEqual(['reserveInventory', 'chargeCard', 'releaseInventory']);

    const history = await runtime.queries.findHistory({ organizationId: ORG, instanceId: instance.id });
    expect(history.workflowHistory.map((entry) => entry.eventType)).toContain('step_compensated');
    expect(history.workflowHistory.map((entry) => entry.eventType)).toContain('instance_failed');
  });

  it('does not compensate steps that have no compensationStepId', async () => {
    const calls: string[] = [];
    const handler: StepHandler = async (step) => {
      calls.push(step.code);
      if (step.code === 'chargeCard') return { success: false, errorMessage: 'declined' };
      return { success: true };
    };
    const runtime = createWorkflowRuntime({ stepHandlers: { service: handler } });

    const steps = [serviceStep('s1', 'reserveInventory'), serviceStep('s2', 'chargeCard')]; // no compensationStepId on s1
    const transitions: Transition[] = [{ transitionId: 't1', fromStepId: 's1', toStepId: 's2', type: 'sequential' }];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'no-compensation',
      name: 'No Compensation',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions,
    });

    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    expect(instance.status).toBe('failed');
    expect(calls).toEqual(['reserveInventory', 'chargeCard']); // no compensation call

    const history = await runtime.queries.findHistory({ organizationId: ORG, instanceId: instance.id });
    expect(history.workflowHistory.map((entry) => entry.eventType)).not.toContain('step_compensated');
  });
});
