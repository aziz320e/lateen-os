/** Real, in-memory {@link AnalyticsReportRepository} implementation. @module report/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AnalyticsReportRepository } from './repository.js';
import type { AnalyticsReport } from './types.js';

/** Creates a real, in-memory {@link AnalyticsReportRepository}. */
export function createAnalyticsReportRepository(seed?: readonly AnalyticsReport[]): AnalyticsReportRepository {
  const repo = createInMemoryRepository<AnalyticsReport>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByFormat(organizationId, format) {
      return repo.list(organizationId).filter((report) => report.format === format);
    },
  };
}
