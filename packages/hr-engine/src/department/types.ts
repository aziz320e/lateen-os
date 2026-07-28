/** @module department/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { DepartmentId, EmployeeId } from '../shared/identifiers.js';

export type { DepartmentId };

/** The three organizational unit types Organization Structure supports. */
export type UnitType = 'department' | 'business_unit' | 'division';

export type DepartmentStatus = 'active' | 'archived';

/** An organizational unit — department, business unit, or division. Hierarchical via `parentDepartmentId`. */
export interface Department extends TenantAuditableEntity<DepartmentId> {
  readonly code: string;
  readonly name: string;
  readonly unitType: UnitType;
  readonly parentDepartmentId?: DepartmentId;
  readonly managerId?: EmployeeId;
  readonly description?: string;
  readonly status: DepartmentStatus;
  readonly currentVersion: number;
}
