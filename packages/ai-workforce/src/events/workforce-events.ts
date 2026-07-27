/** @module events/workforce-events */
import type { DomainEvent, DomainEventName } from '@lateen-os/shared-kernel/core';

export type WorkerLifecycleEventName =
  | DomainEventName<'worker', 'hired'>
  | DomainEventName<'worker', 'activated'>
  | DomainEventName<'worker', 'suspended'>
  | DomainEventName<'worker', 'resumed'>
  | DomainEventName<'worker', 'retired'>;

export type WorkerLifecycleDomainEvent =
  | DomainEvent<'worker.hired', { readonly workerId: string; readonly organizationId: string; readonly workforceType: string }>
  | DomainEvent<'worker.activated', { readonly workerId: string; readonly organizationId: string }>
  | DomainEvent<'worker.suspended', { readonly workerId: string; readonly organizationId: string; readonly reason?: string }>
  | DomainEvent<'worker.resumed', { readonly workerId: string; readonly organizationId: string }>
  | DomainEvent<'worker.retired', { readonly workerId: string; readonly organizationId: string }>;

export type AssignmentEventName =
  | DomainEventName<'assignment', 'created'>
  | DomainEventName<'assignment', 'completed'>
  | DomainEventName<'assignment', 'failed'>;

export type AssignmentDomainEvent =
  | DomainEvent<
      'assignment.created',
      { readonly assignmentId: string; readonly workerId: string; readonly taskId: string; readonly priority: string }
    >
  | DomainEvent<'assignment.completed', { readonly assignmentId: string; readonly workerId: string; readonly taskId: string }>
  | DomainEvent<
      'assignment.failed',
      { readonly assignmentId: string; readonly workerId: string; readonly taskId: string; readonly reason: string }
    >;

export type CapacityEventName = DomainEventName<'capacity', 'changed'>;

export type CapacityDomainEvent = DomainEvent<
  'capacity.changed',
  {
    readonly workerId: string;
    readonly activeTaskCount: number;
    readonly maxConcurrentTasks: number;
    readonly state: string;
  }
>;

export type PerformanceEventName = DomainEventName<'performance', 'updated'>;

export type PerformanceDomainEvent = DomainEvent<
  'performance.updated',
  { readonly workerId: string; readonly overallScore: string; readonly tasksCompleted: number; readonly tasksFailed: number }
>;

/** Canonical event names for external subscribers. */
export const WORKFORCE_EVENT_NAMES = {
  WorkerHired: 'worker.hired',
  WorkerActivated: 'worker.activated',
  WorkerSuspended: 'worker.suspended',
  WorkerResumed: 'worker.resumed',
  WorkerRetired: 'worker.retired',
  AssignmentCreated: 'assignment.created',
  AssignmentCompleted: 'assignment.completed',
  AssignmentFailed: 'assignment.failed',
  CapacityChanged: 'capacity.changed',
  PerformanceUpdated: 'performance.updated',
} as const;

/** Union of all AI Workforce domain events. */
export type WorkforceDomainEvent =
  | WorkerLifecycleDomainEvent
  | AssignmentDomainEvent
  | CapacityDomainEvent
  | PerformanceDomainEvent;
