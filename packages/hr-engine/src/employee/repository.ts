/** @module employee/repository */
import type { DepartmentId } from '../department/types.js';
import type { PositionId } from '../position/types.js';
import type { Repository } from '../shared/repository.js';
import type { EmployeeId, OrganizationId } from '../shared/identifiers.js';
import type { Employee, EmploymentStatus } from './types.js';

export interface EmployeeRepository extends Repository<Employee, EmployeeId> {
  findAll(organizationId: OrganizationId): Promise<readonly Employee[]>;
  findByDepartment(organizationId: OrganizationId, departmentId: DepartmentId): Promise<readonly Employee[]>;
  findByPosition(organizationId: OrganizationId, positionId: PositionId): Promise<readonly Employee[]>;
  findByManager(organizationId: OrganizationId, managerId: EmployeeId): Promise<readonly Employee[]>;
  findByStatus(organizationId: OrganizationId, status: EmploymentStatus): Promise<readonly Employee[]>;
  findByEmployeeNumber(organizationId: OrganizationId, employeeNumber: string): Promise<Employee | null>;
}
