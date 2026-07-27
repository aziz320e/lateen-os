/** Real, in-memory {@link WorkflowGovernanceRecordRepository} implementation. @module workflow-governance/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { WorkflowGovernanceRecordRepository } from './repository.js';
import type { WorkflowGovernanceRecord } from './types.js';

/** Creates a real, in-memory {@link WorkflowGovernanceRecordRepository}. */
export function createWorkflowGovernanceRecordRepository(seed?: readonly WorkflowGovernanceRecord[]): WorkflowGovernanceRecordRepository {
  const repo = createInMemoryRepository<WorkflowGovernanceRecord>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByWorkflowCode(organizationId, workflowCode) {
      return repo.list(organizationId).find((record) => record.workflowCode === workflowCode) ?? null;
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((record) => record.status === status);
    },
  };
}
