/** Real, in-memory {@link SalesTaskRepository} implementation. @module task/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { SalesTask } from './types.js';
import type { SalesTaskRepository } from './repository.js';

/** Creates a real, in-memory {@link SalesTaskRepository}. */
export function createSalesTaskRepository(seed?: readonly SalesTask[]): SalesTaskRepository {
  const repo = createInMemoryRepository<SalesTask>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((task) => task.status === status);
    },
    async findByType(organizationId, taskType) {
      return repo.list(organizationId).filter((task) => task.taskType === taskType);
    },
    async findByOpportunity(organizationId, opportunityId) {
      return repo.list(organizationId).filter((task) => task.opportunityId === opportunityId);
    },
  };
}
