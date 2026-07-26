/**
 * Pure, guarded state-transition functions for workflow instances and step
 * instances — the Workflow State Machine. No I/O; the orchestrator persists
 * whatever these return.
 *
 * @module execution/state-machine
 */
import { InvalidStepTransitionError, InvalidWorkflowTransitionError } from '../shared/errors.js';
import type { WorkflowInstance, WorkflowStatus } from '../instance/types.js';
import type { StepInstance, StepInstanceStatus } from '../step/types.js';

const WORKFLOW_TRANSITIONS: Readonly<Record<WorkflowStatus, readonly WorkflowStatus[]>> = {
  pending: ['running', 'cancelled'],
  running: ['waiting', 'suspended', 'completed', 'failed', 'cancelled'],
  waiting: ['running', 'suspended', 'failed', 'cancelled'],
  suspended: ['running', 'cancelled'],
  completed: [],
  failed: [],
  cancelled: [],
  terminated: [],
};

export function canTransitionWorkflow(from: WorkflowStatus, to: WorkflowStatus): boolean {
  return WORKFLOW_TRANSITIONS[from].includes(to);
}

/** Guarded transition for a {@link WorkflowInstance}. Throws {@link InvalidWorkflowTransitionError} if not allowed. */
export function transitionWorkflowInstance(instance: WorkflowInstance, to: WorkflowStatus, now: string): WorkflowInstance {
  if (!canTransitionWorkflow(instance.status, to)) {
    throw new InvalidWorkflowTransitionError(instance.id, instance.status, to);
  }
  const terminal = to === 'completed' || to === 'failed' || to === 'cancelled';
  return { ...instance, status: to, updatedAt: now, completedAt: terminal ? now : instance.completedAt };
}

const STEP_TRANSITIONS: Readonly<Record<StepInstanceStatus, readonly StepInstanceStatus[]>> = {
  pending: ['ready', 'active', 'waiting', 'skipped', 'cancelled'],
  ready: ['active', 'skipped', 'cancelled'],
  active: ['waiting', 'completed', 'failed', 'skipped', 'cancelled'],
  waiting: ['active', 'completed', 'failed', 'skipped', 'cancelled'],
  completed: [],
  failed: ['active'],
  skipped: [],
  cancelled: [],
};

export function canTransitionStep(from: StepInstanceStatus, to: StepInstanceStatus): boolean {
  return STEP_TRANSITIONS[from].includes(to);
}

/** Guarded transition for a {@link StepInstance}. Throws {@link InvalidStepTransitionError} if not allowed. */
export function transitionStepInstance(step: StepInstance, to: StepInstanceStatus, now: string): StepInstance {
  if (!canTransitionStep(step.status, to)) {
    throw new InvalidStepTransitionError(step.id, step.status, to);
  }
  const completedAt = to === 'completed' || to === 'failed' ? now : step.completedAt;
  return { ...step, status: to, updatedAt: now, completedAt };
}
