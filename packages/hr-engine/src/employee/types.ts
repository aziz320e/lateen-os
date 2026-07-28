/** @module employee/types */
import type { DepartmentId } from '../department/types.js';
import type { PositionId } from '../position/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { EmployeeId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate } from '../shared/primitives.js';

export type { EmployeeId };

export type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'intern';

export type EmploymentStatus = 'active' | 'on_leave' | 'suspended' | 'terminated';

/** The real, authoritative HR employee record — profile, employment status/type, and full lifecycle history. */
export interface Employee extends TenantAuditableEntity<EmployeeId> {
  readonly employeeNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone?: string;
  readonly departmentId: DepartmentId;
  readonly positionId: PositionId;
  readonly managerId?: EmployeeId;
  readonly employmentType: EmploymentType;
  readonly employmentStatus: EmploymentStatus;
  readonly baseSalary: string;
  readonly currency: CurrencyCode;
  readonly hireDate: ISODate;
  readonly terminationDate?: ISODate;
  readonly rehireDate?: ISODate;
  readonly currentVersion: number;
}
