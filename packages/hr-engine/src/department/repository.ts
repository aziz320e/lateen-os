/** @module department/repository */
import type { Repository } from '../shared/repository.js';
import type { DepartmentId, EmployeeId, OrganizationId } from '../shared/identifiers.js';
import type { Department, DepartmentStatus, UnitType } from './types.js';

export interface DepartmentRepository extends Repository<Department, DepartmentId> {
  findAll(organizationId: OrganizationId): Promise<readonly Department[]>;
  findByUnitType(organizationId: OrganizationId, unitType: UnitType): Promise<readonly Department[]>;
  findByStatus(organizationId: OrganizationId, status: DepartmentStatus): Promise<readonly Department[]>;
  findByParent(organizationId: OrganizationId, parentDepartmentId: DepartmentId): Promise<readonly Department[]>;
  findByManager(organizationId: OrganizationId, managerId: EmployeeId): Promise<readonly Department[]>;
}
