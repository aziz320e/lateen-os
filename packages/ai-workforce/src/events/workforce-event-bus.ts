/**
 * Real, typed event bus for the AI Workforce runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/workforce-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type WorkforceEventMap = {
  'worker.hired': { readonly workerId: string; readonly organizationId: string; readonly workforceType: string };
  'worker.activated': { readonly workerId: string; readonly organizationId: string };
  'worker.suspended': { readonly workerId: string; readonly organizationId: string; readonly reason?: string };
  'worker.resumed': { readonly workerId: string; readonly organizationId: string };
  'worker.retired': { readonly workerId: string; readonly organizationId: string };
  'assignment.created': { readonly assignmentId: string; readonly workerId: string; readonly taskId: string; readonly priority: string };
  'assignment.completed': { readonly assignmentId: string; readonly workerId: string; readonly taskId: string };
  'assignment.failed': { readonly assignmentId: string; readonly workerId: string; readonly taskId: string; readonly reason: string };
  'capacity.changed': {
    readonly workerId: string;
    readonly activeTaskCount: number;
    readonly maxConcurrentTasks: number;
    readonly state: string;
  };
  'performance.updated': {
    readonly workerId: string;
    readonly overallScore: string;
    readonly tasksCompleted: number;
    readonly tasksFailed: number;
  };
};

export type WorkforceEventBus = EventBus<WorkforceEventMap>;

/** Creates an in-memory {@link WorkforceEventBus}. */
export function createWorkforceEventBus(): WorkforceEventBus {
  return createEventBus<WorkforceEventMap>();
}
