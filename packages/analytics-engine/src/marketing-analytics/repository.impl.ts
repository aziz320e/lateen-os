/** Real, in-memory {@link MarketingAnalyticsRepository} implementation. @module marketing-analytics/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { MarketingAnalyticsRepository } from './repository.js';
import type { MarketingAnalyticsSnapshot } from './types.js';

/** Creates a real, in-memory {@link MarketingAnalyticsRepository}. */
export function createMarketingAnalyticsRepository(seed?: readonly MarketingAnalyticsSnapshot[]): MarketingAnalyticsRepository {
  const repo = createInMemoryRepository<MarketingAnalyticsSnapshot>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
