/** Real, in-memory {@link RevenueAnalyticsRepository} implementation. @module revenue-analytics/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { RevenueAnalyticsRepository } from './repository.js';
import type { RevenueAnalyticsSnapshot } from './types.js';

/** Creates a real, in-memory {@link RevenueAnalyticsRepository}. */
export function createRevenueAnalyticsRepository(seed?: readonly RevenueAnalyticsSnapshot[]): RevenueAnalyticsRepository {
  const repo = createInMemoryRepository<RevenueAnalyticsSnapshot>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
