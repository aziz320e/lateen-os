import { describe, expect, it } from 'vitest';
import { createWorkflowRuntime } from '../src/runtime.js';
import type { HumanTask, ServiceTask } from '../src/step/types.js';
import type { Transition } from '../src/transition/types.js';

const ORG = 'org-1';

function humanStep(stepId: string, code: string, optional = false): HumanTask {
  return { stepId, code, name: code, type: 'human', optional, assigneeEmployeeId: 'emp-1' };
}

function serviceStep(stepId: string, code: string, optional = false): ServiceTask {
  return { stepId, code, name: code, type: 'service', optional, serviceRef: 'svc://noop', operation: 'noop', inputVariableKeys: [] };
}

async function defineTwoHumanSteps(runtime: ReturnType<typeof createWorkflowRuntime>) {
  const steps = [humanStep('s1', 'review'), humanStep('s2', 'approve')];
  const transitions: Transition[] = [{ transitionId: 't1', fromStepId: 's1', toStepId: 's2', type: 'sequential' }];
  return runtime.defineWorkflow({
    organizationId: ORG,
    code: 'review-approve',
    name: 'Review and Approve',
    metadata: { category: 'approval' },
    version: '1.0.0',
    steps,
    transitions,
  });
}

describe('WorkflowRuntime — manually-completed steps (no handler)', () => {
  it('advances to the next step once dispatch("complete") is issued', async () => {
    const runtime = createWorkflowRuntime();
    const { definition } = await defineTwoHumanSteps(runtime);
    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    expect(instance.status).toBe('running');

    const firstComplete = await runtime.orchestrator.dispatch({
      organizationId: ORG,
      instanceId: instance.id,
      stepId: 's1',
      command: 'complete',
      variables: { reviewedBy: 'alice' },
      issuedAt: '2026-01-01T00:01:00.000Z',
    });
    expect(firstComplete.status).toBe('completed');

    const running = await runtime.queries.findRunningWorkflows({ organizationId: ORG, status: 'running' });
    expect(running.instances).toHaveLength(1);
    expect(running.instances[0]?.variables).toMatchObject({ reviewedBy: 'alice' });

    const secondComplete = await runtime.orchestrator.dispatch({
      organizationId: ORG,
      instanceId: instance.id,
      stepId: 's2',
      command: 'complete',
      issuedAt: '2026-01-01T00:02:00.000Z',
    });
    expect(secondComplete.status).toBe('completed');

    const finished = await runtime.queries.findRunningWorkflows({ organizationId: ORG, status: 'completed' });
    expect(finished.instances).toHaveLength(1);
  });

  it('a "fail" command fails the step and the whole instance', async () => {
    const runtime = createWorkflowRuntime();
    const { definition } = await defineTwoHumanSteps(runtime);
    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    const failed = await runtime.orchestrator.dispatch({
      organizationId: ORG,
      instanceId: instance.id,
      stepId: 's1',
      command: 'fail',
      variables: { errorMessage: 'reviewer rejected' },
      issuedAt: '2026-01-01T00:01:00.000Z',
    });
    expect(failed.status).toBe('failed');

    const found = await runtime.queries.findRunningWorkflows({ organizationId: ORG, status: 'failed' });
    expect(found.instances).toHaveLength(1);
  });

  it('"skip" is only allowed for optional steps and advances the graph', async () => {
    const runtime = createWorkflowRuntime();
    const steps = [serviceStep('s1', 'optional-check', true), serviceStep('s2', 'main', false)];
    const transitions: Transition[] = [{ transitionId: 't1', fromStepId: 's1', toStepId: 's2', type: 'sequential' }];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'with-optional',
      name: 'With Optional',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions,
    });
    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    const skipResult = await runtime.orchestrator.dispatch({
      organizationId: ORG,
      instanceId: instance.id,
      stepId: 's1',
      command: 'skip',
      issuedAt: '2026-01-01T00:01:00.000Z',
    });
    expect(skipResult.status).toBe('completed');

    const history = await runtime.queries.findHistory({ organizationId: ORG, instanceId: instance.id });
    expect(history.workflowHistory.map((entry) => entry.eventType)).toContain('step_skipped');
  });

  it('rejects skipping a non-optional step', async () => {
    const runtime = createWorkflowRuntime();
    const steps = [serviceStep('s1', 'required', false)];
    const { definition } = await runtime.defineWorkflow({
      organizationId: ORG,
      code: 'required-only',
      name: 'Required Only',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps,
      transitions: [],
    });
    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    await expect(
      runtime.orchestrator.dispatch({
        organizationId: ORG,
        instanceId: instance.id,
        stepId: 's1',
        command: 'skip',
        issuedAt: '2026-01-01T00:01:00.000Z',
      }),
    ).rejects.toThrow('is not optional');
  });

  it('suspend/resume/cancel transition the whole instance', async () => {
    const runtime = createWorkflowRuntime();
    const { definition } = await defineTwoHumanSteps(runtime);
    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    await runtime.orchestrator.suspend(ORG, instance.id, 'awaiting external input');
    let suspended = await runtime.queries.findRunningWorkflows({ organizationId: ORG, status: 'suspended' });
    expect(suspended.instances).toHaveLength(1);

    await runtime.orchestrator.resume(ORG, instance.id);
    let running = await runtime.queries.findRunningWorkflows({ organizationId: ORG, status: 'running' });
    expect(running.instances).toHaveLength(1);

    await runtime.orchestrator.cancel(ORG, instance.id, 'no longer needed');
    const cancelled = await runtime.queries.findRunningWorkflows({ organizationId: ORG, status: 'cancelled' });
    expect(cancelled.instances).toHaveLength(1);
  });
});
