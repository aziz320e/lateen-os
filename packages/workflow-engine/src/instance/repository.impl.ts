/** Real in-memory {@link WorkflowInstanceRepository} / {@link WorkflowExecutionRepository} implementations. @module instance/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { WorkflowExecution, WorkflowInstance } from './types.js';
import type { WorkflowExecutionRepository, WorkflowInstanceRepository } from './repository.js';

export function createWorkflowInstanceRepository(seed?: readonly WorkflowInstance[]): WorkflowInstanceRepository {
  const repo = createInMemoryRepository<WorkflowInstance>({ seed });
  return {
    ...repo,
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((instance) => instance.status === status);
    },
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

export function createWorkflowExecutionRepository(seed?: readonly WorkflowExecution[]): WorkflowExecutionRepository {
  return createInMemoryRepository<WorkflowExecution>({ seed });
}
