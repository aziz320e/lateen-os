/** Real, in-memory Budget Tracking repository. @module budget/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ProjectBudgetRepository } from './repository.js';
import type { ProjectBudget } from './types.js';

/** Creates a real, in-memory {@link ProjectBudgetRepository}. */
export function createProjectBudgetRepository(seed?: readonly ProjectBudget[]): ProjectBudgetRepository {
  const repo = createInMemoryRepository<ProjectBudget>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByProject(organizationId, projectId) {
      return repo.list(organizationId).filter((budget) => budget.projectId === projectId);
    },
  };
}
