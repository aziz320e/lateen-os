/** @module employee/repository */
import type { EmployeeId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Employee } from './types.js';

export interface EmployeeRepository extends Repository<Employee, EmployeeId> {
  findByEmployeeNumber(
    organizationId: OrganizationId,
    employeeNumber: string,
  ): Promise<Employee | null>;
  findByEmail(organizationId: OrganizationId, email: string): Promise<Employee | null>;
}
