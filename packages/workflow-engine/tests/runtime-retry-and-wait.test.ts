import { describe, expect, it } from 'vitest';
import { createWorkflowRuntime } from '../src/runtime.js';
import { WaitNotElapsedError } from '../src/shared/errors.js';
import type { StepHandler } from '../src/execution/step-handler.js';
import type { ServiceTask, WaitStep } from '../src/step/types.js';
import type { Transition } from '../src/transition/types.js';

const ORG = 'org-1';
const START = '2026-01-01T00:00:00.000Z';

function serviceStep(stepId: string, code: string, retryPolicy?: ServiceTask['retryPolicy']): ServiceTask {
  return { stepId, code, name: code, type: 'service', optional: false, serviceRef: 'svc://noop', operation: 'noop', inputVariableKeys: [], retryPolicy };
}

function waitStep(stepId: string, code: string, durationMs: number): WaitStep {
  return { stepId, code, name: code, type: 'wait', optional: false, durationMs };
}

describe('WorkflowRuntime — retry policy', () => {
  it('retries a failing handler and succeeds within maxAttempts', async () => {
    let calls = 0;
    const handler: StepHandler = async () => {
      calls += 1;
      if (calls < 3) return { success: false, errorMessage: `attempt ${calls} failed` };
      return { success: true };
    };
    const runtime = createWorkflowRuntime({ stepHandlers: { service: handler } });
    const steps = [serviceStep('s1', 'flaky', { maxAttempts: 5, backoff: 'fixed', initialDelayMs: 1 })];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'flaky-step',
      name: 'Flaky Step',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions: [],
    });

    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    expect(instance.status).toBe('completed');
    expect(calls).toBe(3);

    const waiting = await runtime.queries.findWaitingTasks({ organizationId: ORG, instanceId: instance.id });
    expect(waiting.stepInstances).toHaveLength(0);
  });

  it('fails the instance once retry attempts are exhausted', async () => {
    let calls = 0;
    const handler: StepHandler = async () => {
      calls += 1;
      return { success: false, errorMessage: 'always fails' };
    };
    const runtime = createWorkflowRuntime({ stepHandlers: { service: handler } });
    const steps = [serviceStep('s1', 'broken', { maxAttempts: 3, backoff: 'fixed', initialDelayMs: 1 })];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'broken-step',
      name: 'Broken Step',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions: [],
    });

    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    expect(instance.status).toBe('failed');
    expect(calls).toBe(3);
  });

  it("dispatch('retry') reactivates a handler-less step that previously failed, when attempts remain", async () => {
    const runtime = createWorkflowRuntime();
    const steps = [serviceStep('s1', 'manual', { maxAttempts: 2, backoff: 'fixed', initialDelayMs: 1 })];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'manual-retry',
      name: 'Manual Retry',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions: [],
    });
    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    await runtime.orchestrator.dispatch({
      organizationId: ORG,
      instanceId: instance.id,
      stepId: 's1',
      command: 'fail',
      variables: { errorMessage: 'external system down' },
      issuedAt: START,
    });

    const retried = await runtime.orchestrator.dispatch({
      organizationId: ORG,
      instanceId: instance.id,
      stepId: 's1',
      command: 'retry',
      issuedAt: START,
    });
    expect(retried.status).toBe('running');

    const running = await runtime.queries.findRunningWorkflows({ organizationId: ORG, status: 'running' });
    expect(running.instances).toHaveLength(1);
  });

  it("dispatch('retry') refuses once the step's retry attempts are exhausted", async () => {
    const runtime = createWorkflowRuntime();
    const steps = [serviceStep('s1', 'manual', { maxAttempts: 1, backoff: 'fixed', initialDelayMs: 1 })];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'no-retries-left',
      name: 'No Retries Left',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions: [],
    });
    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    await runtime.orchestrator.dispatch({
      organizationId: ORG,
      instanceId: instance.id,
      stepId: 's1',
      command: 'fail',
      variables: { errorMessage: 'external system down' },
      issuedAt: START,
    });

    await expect(
      runtime.orchestrator.dispatch({ organizationId: ORG, instanceId: instance.id, stepId: 's1', command: 'retry', issuedAt: START }),
    ).rejects.toThrow('no retry attempts remaining');
  });
});

describe('WorkflowRuntime — delay/wait support', () => {
  it('waits until resumeAt and refuses to advance before then', async () => {
    let currentTime = START;
    const runtime = createWorkflowRuntime({ now: () => currentTime });
    const steps = [waitStep('s1', 'cooldown', 60_000)];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'cooldown-only',
      name: 'Cooldown Only',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions: [],
    });

    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    expect(instance.status).toBe('running');

    const waiting = await runtime.queries.findWaitingTasks({ organizationId: ORG, instanceId: instance.id });
    expect(waiting.stepInstances).toHaveLength(1);

    await expect(runtime.orchestrator.advance(ORG, instance.id)).rejects.toBeInstanceOf(WaitNotElapsedError);

    currentTime = new Date(Date.parse(START) + 60_000).toISOString();
    await runtime.orchestrator.advance(ORG, instance.id);

    const finished = await runtime.queries.findRunningWorkflows({ organizationId: ORG, status: 'completed' });
    expect(finished.instances).toHaveLength(1);
  });

  it('continues to the next step once a wait elapses', async () => {
    let currentTime = START;
    const handler: StepHandler = async () => ({ success: true, output: { done: true } });
    const runtime = createWorkflowRuntime({ now: () => currentTime, stepHandlers: { service: handler } });
    const steps = [waitStep('s1', 'pause', 1_000), serviceStep('s2', 'after-pause')];
    const transitions: Transition[] = [{ transitionId: 't1', fromStepId: 's1', toStepId: 's2', type: 'sequential' }];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'pause-then-run',
      name: 'Pause Then Run',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions,
    });

    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    currentTime = new Date(Date.parse(START) + 1_000).toISOString();
    await runtime.orchestrator.advance(ORG, instance.id);

    const finished = await runtime.queries.findRunningWorkflows({ organizationId: ORG, status: 'completed' });
    expect(finished.instances[0]?.variables).toMatchObject({ done: true });
  });
});
