/**
 * Real, typed event bus for the Workflow Engine, built on shared-kernel's
 * generic {@link createEventBus}. Covers the events the real orchestrator
 * actually publishes; not an exhaustive map of every domain in
 * `workflow-events.ts`'s {@link WorkflowEngineDomainEvent} union.
 *
 * @module events/workflow-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint — see ai-runtime's runtime-event-bus.ts.
export type WorkflowEventMap = {
  'workflow.defined': { readonly definitionId: string; readonly code: string; readonly name: string };
  'workflow.published': { readonly definitionId: string; readonly versionId: string; readonly version: string };
  'workflow_instance.started': { readonly instanceId: string; readonly definitionId: string };
  'workflow_instance.completed': { readonly instanceId: string };
  'workflow_instance.failed': { readonly instanceId: string; readonly errorMessage: string };
  'workflow_instance.cancelled': { readonly instanceId: string; readonly reason: string };
  'workflow_instance.suspended': { readonly instanceId: string; readonly reason: string };
  'workflow_instance.resumed': { readonly instanceId: string };
  'step.started': { readonly instanceId: string; readonly stepId: string; readonly stepType: string };
  'step.completed': { readonly instanceId: string; readonly stepId: string; readonly stepInstanceId: string };
  'step.failed': { readonly instanceId: string; readonly stepId: string; readonly errorMessage: string };
  'step.waiting': { readonly instanceId: string; readonly stepId: string; readonly waitingFor: string };
  'step.compensated': { readonly instanceId: string; readonly stepId: string; readonly compensationStepId: string };
};

export type WorkflowEventBus = EventBus<WorkflowEventMap>;

/** Creates an in-memory {@link WorkflowEventBus}. */
export function createWorkflowEventBus(): WorkflowEventBus {
  return createEventBus<WorkflowEventMap>();
}
