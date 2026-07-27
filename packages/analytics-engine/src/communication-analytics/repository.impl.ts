/** Real, in-memory {@link CommunicationAnalyticsRepository} implementation. @module communication-analytics/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { CommunicationAnalyticsRepository } from './repository.js';
import type { CommunicationAnalyticsSnapshot } from './types.js';

/** Creates a real, in-memory {@link CommunicationAnalyticsRepository}. */
export function createCommunicationAnalyticsRepository(seed?: readonly CommunicationAnalyticsSnapshot[]): CommunicationAnalyticsRepository {
  const repo = createInMemoryRepository<CommunicationAnalyticsSnapshot>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
