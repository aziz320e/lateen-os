/** Real, in-memory Project Risks repository. @module risk/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ProjectRiskRepository } from './repository.js';
import type { ProjectRisk } from './types.js';

/** Creates a real, in-memory {@link ProjectRiskRepository}. */
export function createProjectRiskRepository(seed?: readonly ProjectRisk[]): ProjectRiskRepository {
  const repo = createInMemoryRepository<ProjectRisk>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByProject(organizationId, projectId) {
      return repo.list(organizationId).filter((risk) => risk.projectId === projectId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((risk) => risk.status === status);
    },
  };
}
