/** @module position/types */
import type { DepartmentId } from '../department/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { PositionId } from '../shared/identifiers.js';
import type { CurrencyCode } from '../shared/primitives.js';

export type { PositionId };

export type PositionStatus = 'active' | 'archived';

/** A budgeted role slot within a department, with a fixed headcount. */
export interface Position extends TenantAuditableEntity<PositionId> {
  readonly title: string;
  readonly departmentId: DepartmentId;
  readonly jobGrade: string;
  readonly salaryGrade: string;
  readonly baseSalary: string;
  readonly currency: CurrencyCode;
  readonly headcount: number;
  readonly filledCount: number;
  readonly status: PositionStatus;
  readonly currentVersion: number;
}
