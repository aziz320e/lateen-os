/** Real, in-memory Material Planning repository. @module material/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { MaterialRequirementRepository } from './repository.js';
import type { MaterialRequirement } from './types.js';

/** Creates a real, in-memory {@link MaterialRequirementRepository}. */
export function createMaterialRequirementRepository(seed?: readonly MaterialRequirement[]): MaterialRequirementRepository {
  const repo = createInMemoryRepository<MaterialRequirement>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByProject(organizationId, projectId) {
      return repo.list(organizationId).filter((requirement) => requirement.projectId === projectId);
    },
    async findByTask(organizationId, taskId) {
      return repo.list(organizationId).filter((requirement) => requirement.taskId === taskId);
    },
    async findByItem(organizationId, itemId) {
      return repo.list(organizationId).filter((requirement) => requirement.itemId === itemId);
    },
  };
}
