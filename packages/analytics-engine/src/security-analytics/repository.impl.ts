/** Real, in-memory {@link SecurityAnalyticsRepository} implementation. @module security-analytics/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { SecurityAnalyticsRepository } from './repository.js';
import type { SecurityAnalyticsSnapshot } from './types.js';

/** Creates a real, in-memory {@link SecurityAnalyticsRepository}. */
export function createSecurityAnalyticsRepository(seed?: readonly SecurityAnalyticsSnapshot[]): SecurityAnalyticsRepository {
  const repo = createInMemoryRepository<SecurityAnalyticsSnapshot>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
