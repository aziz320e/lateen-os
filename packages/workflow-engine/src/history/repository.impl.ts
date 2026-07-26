/** Real in-memory {@link WorkflowHistoryRepository} / {@link ExecutionHistoryRepository} / {@link AuditTrailRepository} implementations. @module history/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AuditTrail, ExecutionHistory, WorkflowHistory } from './types.js';
import type { AuditTrailRepository, ExecutionHistoryRepository, WorkflowHistoryRepository } from './repository.js';

export function createWorkflowHistoryRepository(seed?: readonly WorkflowHistory[]): WorkflowHistoryRepository {
  const repo = createInMemoryRepository<WorkflowHistory>({ seed });
  return {
    ...repo,
    async findByInstance(organizationId, instanceId) {
      return repo.list(organizationId).filter((entry) => entry.instanceId === instanceId);
    },
  };
}

export function createExecutionHistoryRepository(seed?: readonly ExecutionHistory[]): ExecutionHistoryRepository {
  const repo = createInMemoryRepository<ExecutionHistory>({ seed });
  return {
    ...repo,
    async findByInstance(organizationId, instanceId) {
      return repo.list(organizationId).filter((entry) => entry.instanceId === instanceId);
    },
  };
}

export function createAuditTrailRepository(seed?: readonly AuditTrail[]): AuditTrailRepository {
  const repo = createInMemoryRepository<AuditTrail>({ seed });
  return {
    ...repo,
    async findByInstance(organizationId, instanceId) {
      return repo.list(organizationId).filter((entry) => entry.instanceId === instanceId);
    },
  };
}
