/** Real in-memory {@link TaskAssignmentRepository} implementation. @module collaboration/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { TaskAssignment } from './types.js';
import type { TaskAssignmentRepository } from './repository.js';

/** Creates a real, in-memory {@link TaskAssignmentRepository}. */
export function createTaskAssignmentRepository(seed?: readonly TaskAssignment[]): TaskAssignmentRepository {
  const repo = createInMemoryRepository<TaskAssignment>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByWorker(organizationId, workerId) {
      return repo.list(organizationId).filter((assignment) => assignment.workerId === workerId);
    },
  };
}
