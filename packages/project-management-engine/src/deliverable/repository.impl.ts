/** Real, in-memory Deliverables repository. @module deliverable/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DeliverableRepository } from './repository.js';
import type { Deliverable } from './types.js';

/** Creates a real, in-memory {@link DeliverableRepository}. */
export function createDeliverableRepository(seed?: readonly Deliverable[]): DeliverableRepository {
  const repo = createInMemoryRepository<Deliverable>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByProject(organizationId, projectId) {
      return repo.list(organizationId).filter((deliverable) => deliverable.projectId === projectId);
    },
    async findByTask(organizationId, taskId) {
      return repo.list(organizationId).filter((deliverable) => deliverable.taskId === taskId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((deliverable) => deliverable.status === status);
    },
  };
}
