/** @module events/project-events */
import type { DomainEvent } from '@lateen-os/shared-kernel/core';

export type ProjectCreatedEvent = DomainEvent<
  'project.created',
  { readonly organizationId: string; readonly projectId: string; readonly name: string }
>;

export type ProjectStartedEvent = DomainEvent<
  'project.started',
  { readonly organizationId: string; readonly projectId: string }
>;

export type ProjectCompletedEvent = DomainEvent<
  'project.completed',
  { readonly organizationId: string; readonly projectId: string }
>;

export type ProjectCancelledEvent = DomainEvent<
  'project.cancelled',
  { readonly organizationId: string; readonly projectId: string; readonly reason?: string }
>;

export type TaskCreatedEvent = DomainEvent<
  'task.created',
  { readonly organizationId: string; readonly taskId: string; readonly projectId: string; readonly title: string }
>;

export type TaskCompletedEvent = DomainEvent<
  'task.completed',
  { readonly organizationId: string; readonly taskId: string; readonly projectId: string }
>;

export type ResourceAssignedEvent = DomainEvent<
  'resource.assigned',
  { readonly organizationId: string; readonly assignmentId: string; readonly projectId: string; readonly assigneeId: string; readonly assigneeType: string }
>;

export type BudgetUpdatedEvent = DomainEvent<
  'budget.updated',
  { readonly organizationId: string; readonly budgetId: string; readonly projectId: string; readonly remainingBudget: string }
>;

export type RiskCreatedEvent = DomainEvent<
  'risk.created',
  { readonly organizationId: string; readonly riskId: string; readonly projectId: string; readonly score: number }
>;

export type DeliverableAcceptedEvent = DomainEvent<
  'deliverable.accepted',
  { readonly organizationId: string; readonly deliverableId: string; readonly projectId: string }
>;

/** Canonical event names for external subscribers. */
export const PROJECT_EVENT_NAMES = {
  ProjectCreated: 'project.created',
  ProjectStarted: 'project.started',
  ProjectCompleted: 'project.completed',
  ProjectCancelled: 'project.cancelled',
  TaskCreated: 'task.created',
  TaskCompleted: 'task.completed',
  ResourceAssigned: 'resource.assigned',
  BudgetUpdated: 'budget.updated',
  RiskCreated: 'risk.created',
  DeliverableAccepted: 'deliverable.accepted',
} as const;

/** Union of all Project Management Engine domain events. */
export type ProjectDomainEvent =
  | ProjectCreatedEvent
  | ProjectStartedEvent
  | ProjectCompletedEvent
  | ProjectCancelledEvent
  | TaskCreatedEvent
  | TaskCompletedEvent
  | ResourceAssignedEvent
  | BudgetUpdatedEvent
  | RiskCreatedEvent
  | DeliverableAcceptedEvent;
