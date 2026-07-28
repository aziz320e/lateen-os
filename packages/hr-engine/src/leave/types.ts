/** @module leave/types */
import type { EmployeeId } from '../employee/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { LeaveBalanceId, LeaveRequestId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';

export type { LeaveBalanceId, LeaveRequestId };

/** The five leave types Leave Management supports. */
export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'maternity_paternity' | 'emergency';

export type LeaveRequestStatus = 'requested' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export interface LeaveRequest extends TenantAuditableEntity<LeaveRequestId> {
  readonly employeeId: EmployeeId;
  readonly leaveType: LeaveType;
  readonly startDate: ISODate;
  readonly endDate: ISODate;
  readonly daysRequested: number;
  readonly reason?: string;
  readonly status: LeaveRequestStatus;
}

/** Per-employee, per-year, per-type allocation. Only `annual` and `sick` leave are balance-tracked. */
export interface LeaveBalance extends TenantAuditableEntity<LeaveBalanceId> {
  readonly employeeId: EmployeeId;
  readonly leaveType: LeaveType;
  readonly year: number;
  readonly allocatedDays: number;
  readonly usedDays: number;
}
