/** @module employee/types */
import type { Entity } from '../shared/entity.js';
import type {
  BranchId,
  DepartmentId,
  EmployeeId,
  IdentityId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { RoleId } from '../role/types.js';
import type { Auditable, ISODate, TenantScoped } from '../shared/primitives.js';

export type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'intern';
export type EmployeeStatus =
  | 'draft'
  | 'active'
  | 'on_leave'
  | 'suspended'
  | 'terminated'
  | 'archived';

export interface Employee extends Entity<EmployeeId>, TenantScoped, Auditable {
  readonly branchId?: BranchId;
  readonly departmentId?: DepartmentId;
  readonly employeeNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone?: string;
  readonly jobTitle?: string;
  readonly employmentType: EmploymentType;
  readonly status: EmployeeStatus;
  readonly managerId?: EmployeeId;
  readonly hiredAt?: ISODate;
  readonly terminatedAt?: ISODate;
  readonly identityId?: IdentityId;
  readonly roleIds?: readonly RoleId[];
}

export type { OrganizationId };
