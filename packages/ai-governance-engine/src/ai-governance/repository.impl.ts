/** Real, in-memory {@link AiGovernanceRecordRepository} implementation. @module ai-governance/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AiGovernanceRecordRepository } from './repository.js';
import type { AiGovernanceRecord } from './types.js';

/** Creates a real, in-memory {@link AiGovernanceRecordRepository}. */
export function createAiGovernanceRecordRepository(seed?: readonly AiGovernanceRecord[]): AiGovernanceRecordRepository {
  const repo = createInMemoryRepository<AiGovernanceRecord>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByTargetType(organizationId, targetType) {
      return repo.list(organizationId).filter((record) => record.targetType === targetType);
    },
    async findByTarget(organizationId, targetType, targetId) {
      return repo.list(organizationId).find((record) => record.targetType === targetType && record.targetId === targetId) ?? null;
    },
  };
}
