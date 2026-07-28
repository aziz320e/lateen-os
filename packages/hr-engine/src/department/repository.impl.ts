/** Real, in-memory Organization Structure repository. @module department/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DepartmentRepository } from './repository.js';
import type { Department } from './types.js';

/** Creates a real, in-memory {@link DepartmentRepository}. */
export function createDepartmentRepository(seed?: readonly Department[]): DepartmentRepository {
  const repo = createInMemoryRepository<Department>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByUnitType(organizationId, unitType) {
      return repo.list(organizationId).filter((department) => department.unitType === unitType);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((department) => department.status === status);
    },
    async findByParent(organizationId, parentDepartmentId) {
      return repo.list(organizationId).filter((department) => department.parentDepartmentId === parentDepartmentId);
    },
    async findByManager(organizationId, managerId) {
      return repo.list(organizationId).filter((department) => department.managerId === managerId);
    },
  };
}
