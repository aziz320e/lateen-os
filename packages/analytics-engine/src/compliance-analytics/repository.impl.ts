/** Real, in-memory {@link ComplianceAnalyticsRepository} implementation. @module compliance-analytics/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ComplianceAnalyticsRepository } from './repository.js';
import type { ComplianceAnalyticsSnapshot } from './types.js';

/** Creates a real, in-memory {@link ComplianceAnalyticsRepository}. */
export function createComplianceAnalyticsRepository(seed?: readonly ComplianceAnalyticsSnapshot[]): ComplianceAnalyticsRepository {
  const repo = createInMemoryRepository<ComplianceAnalyticsSnapshot>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
