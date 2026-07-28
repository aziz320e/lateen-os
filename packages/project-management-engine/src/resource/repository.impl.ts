/** Real, in-memory Resource Planning repository. @module resource/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ResourceAssignmentRepository } from './repository.js';
import type { ResourceAssignment } from './types.js';

/** Creates a real, in-memory {@link ResourceAssignmentRepository}. */
export function createResourceAssignmentRepository(seed?: readonly ResourceAssignment[]): ResourceAssignmentRepository {
  const repo = createInMemoryRepository<ResourceAssignment>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByProject(organizationId, projectId) {
      return repo.list(organizationId).filter((assignment) => assignment.projectId === projectId);
    },
    async findByTask(organizationId, taskId) {
      return repo.list(organizationId).filter((assignment) => assignment.taskId === taskId);
    },
    async findByAssignee(organizationId, assigneeId) {
      return repo.list(organizationId).filter((assignment) => assignment.assigneeId === assigneeId);
    },
  };
}
