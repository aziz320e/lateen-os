/** Real, in-memory Time Tracking repository. @module timetracking/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { WorkLogRepository } from './repository.js';
import type { WorkLog } from './types.js';

/** Creates a real, in-memory {@link WorkLogRepository}. */
export function createWorkLogRepository(seed?: readonly WorkLog[]): WorkLogRepository {
  const repo = createInMemoryRepository<WorkLog>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByProject(organizationId, projectId) {
      return repo.list(organizationId).filter((log) => log.projectId === projectId);
    },
    async findByTask(organizationId, taskId) {
      return repo.list(organizationId).filter((log) => log.taskId === taskId);
    },
    async findByAssignee(organizationId, assigneeId) {
      return repo.list(organizationId).filter((log) => log.assigneeId === assigneeId);
    },
  };
}
