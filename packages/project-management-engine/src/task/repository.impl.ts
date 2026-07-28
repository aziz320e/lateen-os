/** Real, in-memory Task Management repository. @module task/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ProjectTaskRepository } from './repository.js';
import type { ProjectTask } from './types.js';

/** Creates a real, in-memory {@link ProjectTaskRepository}. */
export function createProjectTaskRepository(seed?: readonly ProjectTask[]): ProjectTaskRepository {
  const repo = createInMemoryRepository<ProjectTask>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByProject(organizationId, projectId) {
      return repo.list(organizationId).filter((task) => task.projectId === projectId);
    },
    async findByParent(organizationId, parentTaskId) {
      return repo.list(organizationId).filter((task) => task.parentTaskId === parentTaskId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((task) => task.status === status);
    },
    async findByPriority(organizationId, priority) {
      return repo.list(organizationId).filter((task) => task.priority === priority);
    },
    async findByLabel(organizationId, label) {
      return repo.list(organizationId).filter((task) => task.labels.includes(label));
    },
  };
}
