/** Real in-memory {@link WorkflowDefinitionRepository} / {@link WorkflowVersionRepository} implementations. @module workflow/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { WorkflowDefinition, WorkflowVersion } from './types.js';
import type { WorkflowDefinitionRepository, WorkflowVersionRepository } from './repository.js';

export function createWorkflowDefinitionRepository(seed?: readonly WorkflowDefinition[]): WorkflowDefinitionRepository {
  const repo = createInMemoryRepository<WorkflowDefinition>({ seed });
  return {
    ...repo,
    async findByCode(organizationId, code) {
      return repo.list(organizationId).find((definition) => definition.code === code) ?? null;
    },
  };
}

export function createWorkflowVersionRepository(seed?: readonly WorkflowVersion[]): WorkflowVersionRepository {
  return createInMemoryRepository<WorkflowVersion>({ seed });
}
