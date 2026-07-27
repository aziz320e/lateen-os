/** Real, in-memory {@link RiskRepository} implementation. @module risk/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { RiskRepository } from './repository.js';
import type { Risk } from './types.js';

/** Creates a real, in-memory {@link RiskRepository}. */
export function createRiskRepository(seed?: readonly Risk[]): RiskRepository {
  const repo = createInMemoryRepository<Risk>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByLevel(organizationId, riskLevel) {
      return repo.list(organizationId).filter((risk) => risk.riskLevel === riskLevel);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((risk) => risk.status === status);
    },
  };
}
