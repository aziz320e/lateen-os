/** Real, in-memory {@link SalesAnalyticsRepository} implementation. @module sales-analytics/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { SalesAnalyticsRepository } from './repository.js';
import type { SalesAnalyticsSnapshot } from './types.js';

/** Creates a real, in-memory {@link SalesAnalyticsRepository}. */
export function createSalesAnalyticsRepository(seed?: readonly SalesAnalyticsSnapshot[]): SalesAnalyticsRepository {
  const repo = createInMemoryRepository<SalesAnalyticsSnapshot>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
