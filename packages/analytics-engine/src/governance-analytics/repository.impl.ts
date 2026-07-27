/** Real, in-memory {@link GovernanceAnalyticsRepository} implementation. @module governance-analytics/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { GovernanceAnalyticsRepository } from './repository.js';
import type { GovernanceAnalyticsSnapshot } from './types.js';

/** Creates a real, in-memory {@link GovernanceAnalyticsRepository}. */
export function createGovernanceAnalyticsRepository(seed?: readonly GovernanceAnalyticsSnapshot[]): GovernanceAnalyticsRepository {
  const repo = createInMemoryRepository<GovernanceAnalyticsSnapshot>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
