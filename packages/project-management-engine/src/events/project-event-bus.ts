/**
 * Real, typed event bus for the Project Management Engine runtime,
 * built on shared-kernel's generic {@link createEventBus}.
 *
 * @module events/project-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type ProjectEventMap = {
  'project.created': { readonly organizationId: string; readonly projectId: string; readonly name: string };
  'project.started': { readonly organizationId: string; readonly projectId: string };
  'project.completed': { readonly organizationId: string; readonly projectId: string };
  'project.cancelled': { readonly organizationId: string; readonly projectId: string; readonly reason?: string };
  'task.created': { readonly organizationId: string; readonly taskId: string; readonly projectId: string; readonly title: string };
  'task.completed': { readonly organizationId: string; readonly taskId: string; readonly projectId: string };
  'resource.assigned': { readonly organizationId: string; readonly assignmentId: string; readonly projectId: string; readonly assigneeId: string; readonly assigneeType: string };
  'budget.updated': { readonly organizationId: string; readonly budgetId: string; readonly projectId: string; readonly remainingBudget: string };
  'risk.created': { readonly organizationId: string; readonly riskId: string; readonly projectId: string; readonly score: number };
  'deliverable.accepted': { readonly organizationId: string; readonly deliverableId: string; readonly projectId: string };
};

export type ProjectEventBus = EventBus<ProjectEventMap>;

/** Creates an in-memory {@link ProjectEventBus}. */
export function createProjectEventBus(): ProjectEventBus {
  return createEventBus<ProjectEventMap>();
}
