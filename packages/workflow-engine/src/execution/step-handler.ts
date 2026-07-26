/**
 * Step execution DI seam. The Workflow Engine coordinates step handoffs —
 * it does not execute business logic — so the actual work for a step type
 * (calling AI Runtime, a service, Decision Engine, ...) is a caller-supplied
 * handler. A step type with no registered handler stays "active"/"waiting"
 * for an external system to report completion via `dispatch({command:
 * 'complete' | 'fail'})`.
 *
 * @module execution/step-handler
 */
import type { WorkflowStep } from '../step/types.js';
import type { OrganizationId, WorkflowInstanceId } from '../shared/identifiers.js';

export interface StepHandlerContext {
  readonly organizationId: OrganizationId;
  readonly instanceId: WorkflowInstanceId;
  readonly variables: Readonly<Record<string, unknown>>;
  readonly attempt: number;
}

export interface StepHandlerResult {
  readonly success: boolean;
  readonly output?: Readonly<Record<string, unknown>>;
  readonly errorMessage?: string;
}

export type StepHandler = (step: WorkflowStep, context: StepHandlerContext) => Promise<StepHandlerResult>;
