/** Real, in-memory {@link ModelGovernanceRecordRepository} implementation. @module model-governance/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ModelGovernanceRecordRepository } from './repository.js';
import type { ModelGovernanceRecord } from './types.js';

/** Creates a real, in-memory {@link ModelGovernanceRecordRepository}. */
export function createModelGovernanceRecordRepository(seed?: readonly ModelGovernanceRecord[]): ModelGovernanceRecordRepository {
  const repo = createInMemoryRepository<ModelGovernanceRecord>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByModelId(organizationId, modelId) {
      return repo.list(organizationId).find((record) => record.modelId === modelId) ?? null;
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((record) => record.status === status);
    },
  };
}
