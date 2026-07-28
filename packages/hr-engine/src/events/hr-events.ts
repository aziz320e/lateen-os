/** @module events/hr-events */
import type { DomainEvent } from '@lateen-os/shared-kernel/core';

export type EmployeeHiredEvent = DomainEvent<
  'employee.hired',
  { readonly organizationId: string; readonly employeeId: string; readonly departmentId: string; readonly positionId: string }
>;

export type EmployeeTransferredEvent = DomainEvent<
  'employee.transferred',
  { readonly organizationId: string; readonly employeeId: string; readonly departmentId: string; readonly positionId: string }
>;

export type EmployeePromotedEvent = DomainEvent<
  'employee.promoted',
  { readonly organizationId: string; readonly employeeId: string; readonly positionId: string }
>;

export type EmployeeTerminatedEvent = DomainEvent<'employee.terminated', { readonly organizationId: string; readonly employeeId: string }>;

export type AttendanceRecordedEvent = DomainEvent<
  'attendance.recorded',
  { readonly organizationId: string; readonly employeeId: string; readonly workSessionId: string; readonly durationMinutes: number }
>;

export type LeaveRequestedEvent = DomainEvent<
  'leave.requested',
  { readonly organizationId: string; readonly leaveRequestId: string; readonly employeeId: string }
>;

export type LeaveApprovedEvent = DomainEvent<'leave.approved', { readonly organizationId: string; readonly leaveRequestId: string; readonly employeeId: string }>;

export type PerformanceCompletedEvent = DomainEvent<
  'performance.completed',
  { readonly organizationId: string; readonly evaluationId: string; readonly employeeId: string; readonly overallRating: number }
>;

export type TrainingCompletedEvent = DomainEvent<
  'training.completed',
  { readonly organizationId: string; readonly trainingCompletionId: string; readonly employeeId: string; readonly courseId: string }
>;

export type PayrollPreparedEvent = DomainEvent<'payroll.prepared', { readonly organizationId: string; readonly payrollRunId: string; readonly totalNet: string }>;

/** Canonical event names for external subscribers. */
export const HR_EVENT_NAMES = {
  EmployeeHired: 'employee.hired',
  EmployeeTransferred: 'employee.transferred',
  EmployeePromoted: 'employee.promoted',
  EmployeeTerminated: 'employee.terminated',
  AttendanceRecorded: 'attendance.recorded',
  LeaveRequested: 'leave.requested',
  LeaveApproved: 'leave.approved',
  PerformanceCompleted: 'performance.completed',
  TrainingCompleted: 'training.completed',
  PayrollPrepared: 'payroll.prepared',
} as const;

/** Union of all HR Engine domain events. */
export type HrDomainEvent =
  | EmployeeHiredEvent
  | EmployeeTransferredEvent
  | EmployeePromotedEvent
  | EmployeeTerminatedEvent
  | AttendanceRecordedEvent
  | LeaveRequestedEvent
  | LeaveApprovedEvent
  | PerformanceCompletedEvent
  | TrainingCompletedEvent
  | PayrollPreparedEvent;
