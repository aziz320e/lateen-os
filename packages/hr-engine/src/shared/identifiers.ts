/**
 * Identifier types for the HR Engine bounded context.
 *
 * Business DNA's `Employee`/`Department` are contracts-only (no
 * runtime service, not queryable) — the HR Engine is the real,
 * authoritative implementation of both concepts, so it owns its own
 * identifier namespace rather than reusing Business DNA's. Only
 * `OrganizationId` (the canonical tenant id) is reused directly.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { OrganizationId } from '@lateen-os/business-dna';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Organization Structure. */
export type DepartmentId = Identifier;

/** Position Management. */
export type PositionId = Identifier;

/** Employee Management. */
export type EmployeeId = Identifier;

/** Attendance Engine. */
export type WorkSessionId = Identifier;
export type HolidayId = Identifier;
export type AbsenceRecordId = Identifier;

/** Leave Management. */
export type LeaveRequestId = Identifier;
export type LeaveBalanceId = Identifier;

/** Payroll Preparation. */
export type PayrollRunId = Identifier;

/** Performance Management. */
export type ReviewPeriodId = Identifier;
export type ObjectiveId = Identifier;
export type EvaluationId = Identifier;

/** Training Engine. */
export type CourseId = Identifier;
export type CertificationId = Identifier;
export type EmployeeSkillId = Identifier;
export type TrainingCompletionId = Identifier;
