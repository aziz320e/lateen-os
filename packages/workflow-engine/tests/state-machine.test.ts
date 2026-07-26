import { describe, expect, it } from 'vitest';
import {
  canTransitionStep,
  canTransitionWorkflow,
  transitionStepInstance,
  transitionWorkflowInstance,
} from '../src/execution/state-machine.js';
import { InvalidStepTransitionError, InvalidWorkflowTransitionError } from '../src/shared/errors.js';
import type { WorkflowInstance } from '../src/instance/types.js';
import type { StepInstance } from '../src/step/types.js';

const NOW = '2026-01-01T00:00:00.000Z';
const LATER = '2026-01-01T00:05:00.000Z';

function makeInstance(status: WorkflowInstance['status']): WorkflowInstance {
  return {
    id: 'instance-1',
    organizationId: 'org-1',
    createdAt: NOW,
    updatedAt: NOW,
    definitionId: 'def-1',
    versionId: 'ver-1',
    status,
    startedAt: NOW,
    variables: {},
  };
}

function makeStepInstance(status: StepInstance['status']): StepInstance {
  return {
    id: 'step-instance-1',
    organizationId: 'org-1',
    createdAt: NOW,
    updatedAt: NOW,
    instanceId: 'instance-1',
    stepId: 'step-1',
    stepType: 'service',
    status,
    attempt: 1,
  };
}

describe('workflow instance state machine', () => {
  it('allows pending -> running -> completed', () => {
    expect(canTransitionWorkflow('pending', 'running')).toBe(true);
    expect(canTransitionWorkflow('running', 'completed')).toBe(true);
  });

  it('rejects completed -> running (terminal states have no outgoing transitions)', () => {
    expect(canTransitionWorkflow('completed', 'running')).toBe(false);
  });

  it('transitionWorkflowInstance applies the new status and stamps completedAt for terminal states', () => {
    const running = transitionWorkflowInstance(makeInstance('pending'), 'running', LATER);
    expect(running.status).toBe('running');
    expect(running.completedAt).toBeUndefined();

    const completed = transitionWorkflowInstance(running, 'completed', LATER);
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBe(LATER);
  });

  it('throws InvalidWorkflowTransitionError for a disallowed transition', () => {
    expect(() => transitionWorkflowInstance(makeInstance('completed'), 'running', LATER)).toThrow(InvalidWorkflowTransitionError);
  });
});

describe('step instance state machine', () => {
  it('allows pending -> active -> completed', () => {
    expect(canTransitionStep('pending', 'active')).toBe(true);
    expect(canTransitionStep('active', 'completed')).toBe(true);
  });

  it('allows failed -> active (retry)', () => {
    expect(canTransitionStep('failed', 'active')).toBe(true);
  });

  it('rejects completed -> active', () => {
    expect(canTransitionStep('completed', 'active')).toBe(false);
  });

  it('transitionStepInstance stamps completedAt on completion and failure only', () => {
    const completed = transitionStepInstance(makeStepInstance('active'), 'completed', LATER);
    expect(completed.completedAt).toBe(LATER);

    const waiting = transitionStepInstance(makeStepInstance('active'), 'waiting', LATER);
    expect(waiting.completedAt).toBeUndefined();
  });

  it('throws InvalidStepTransitionError for a disallowed transition', () => {
    expect(() => transitionStepInstance(makeStepInstance('completed'), 'active', LATER)).toThrow(InvalidStepTransitionError);
  });
});
