/** Real in-memory {@link TaskRepository} implementation. @module task/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { TaskId } from '../shared/identifiers.js';
import type { Task } from './types.js';
import type { TaskRepository } from './repository.js';

export function createTaskRepository(seed?: readonly Task[]): TaskRepository {
  const repo = createInMemoryRepository<Task, TaskId>({ seed });
  return {
    ...repo,
    async findByAgent(organizationId, runtimeAgentId) {
      return repo.list(organizationId).filter((task) => task.runtimeAgentId === runtimeAgentId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((task) => task.status === status);
    },
  };
}
