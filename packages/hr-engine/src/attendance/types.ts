/** @module attendance/types */
import type { EmployeeId } from '../employee/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AbsenceRecordId, HolidayId, WorkSessionId } from '../shared/identifiers.js';
import type { ISODate, ISODateTime } from '../shared/primitives.js';

export type { AbsenceRecordId, HolidayId, WorkSessionId };

export type WorkSessionStatus = 'open' | 'closed';

/** One clock-in/clock-out work session, with deterministic duration/overtime/lateness computed on clock-out. */
export interface WorkSession extends TenantAuditableEntity<WorkSessionId> {
  readonly employeeId: EmployeeId;
  readonly clockInAt: ISODateTime;
  readonly clockOutAt?: ISODateTime;
  readonly scheduledStartAt?: ISODateTime;
  readonly durationMinutes?: number;
  readonly overtimeMinutes?: number;
  readonly lateMinutes?: number;
  readonly status: WorkSessionStatus;
}

/** A single-day absence record. */
export interface AbsenceRecord extends TenantAuditableEntity<AbsenceRecordId> {
  readonly employeeId: EmployeeId;
  readonly date: ISODate;
  readonly reason?: string;
}

/** An organization-wide non-working day. */
export interface Holiday extends TenantAuditableEntity<HolidayId> {
  readonly date: ISODate;
  readonly name: string;
}
