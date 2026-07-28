/** Real, in-memory Employee Management repository. @module employee/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { EmployeeRepository } from './repository.js';
import type { Employee } from './types.js';

/** Creates a real, in-memory {@link EmployeeRepository}. */
export function createEmployeeRepository(seed?: readonly Employee[]): EmployeeRepository {
  const repo = createInMemoryRepository<Employee>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByDepartment(organizationId, departmentId) {
      return repo.list(organizationId).filter((employee) => employee.departmentId === departmentId);
    },
    async findByPosition(organizationId, positionId) {
      return repo.list(organizationId).filter((employee) => employee.positionId === positionId);
    },
    async findByManager(organizationId, managerId) {
      return repo.list(organizationId).filter((employee) => employee.managerId === managerId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((employee) => employee.employmentStatus === status);
    },
    async findByEmployeeNumber(organizationId, employeeNumber) {
      return repo.list(organizationId).find((employee) => employee.employeeNumber === employeeNumber) ?? null;
    },
  };
}
