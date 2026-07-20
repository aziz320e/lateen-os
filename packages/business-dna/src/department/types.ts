/** @module department/types */
import type { Entity } from '../shared/entity.js';
import type {
  BranchId,
  DepartmentId,
  EmployeeId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { Auditable, BusinessCode, TenantScoped } from '../shared/primitives.js';

export type DepartmentStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface Department extends Entity<DepartmentId>, TenantScoped, Auditable {
  readonly branchId?: BranchId;
  readonly parentDepartmentId?: DepartmentId;
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly status: DepartmentStatus;
  readonly headId?: EmployeeId;
  readonly costCenter?: string;
}

export type { OrganizationId };
