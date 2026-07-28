/**
 * Real, typed event bus for the HR Engine runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/hr-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type HrEventMap = {
  'employee.hired': { readonly organizationId: string; readonly employeeId: string; readonly departmentId: string; readonly positionId: string };
  'employee.transferred': { readonly organizationId: string; readonly employeeId: string; readonly departmentId: string; readonly positionId: string };
  'employee.promoted': { readonly organizationId: string; readonly employeeId: string; readonly positionId: string };
  'employee.terminated': { readonly organizationId: string; readonly employeeId: string };
  'attendance.recorded': { readonly organizationId: string; readonly employeeId: string; readonly workSessionId: string; readonly durationMinutes: number };
  'leave.requested': { readonly organizationId: string; readonly leaveRequestId: string; readonly employeeId: string };
  'leave.approved': { readonly organizationId: string; readonly leaveRequestId: string; readonly employeeId: string };
  'performance.completed': { readonly organizationId: string; readonly evaluationId: string; readonly employeeId: string; readonly overallRating: number };
  'training.completed': { readonly organizationId: string; readonly trainingCompletionId: string; readonly employeeId: string; readonly courseId: string };
  'payroll.prepared': { readonly organizationId: string; readonly payrollRunId: string; readonly totalNet: string };
};

export type HrEventBus = EventBus<HrEventMap>;

/** Creates an in-memory {@link HrEventBus}. */
export function createHrEventBus(): HrEventBus {
  return createEventBus<HrEventMap>();
}
