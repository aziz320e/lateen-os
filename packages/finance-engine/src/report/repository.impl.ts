/** Real, in-memory Financial Report repository. @module report/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { FinanceReportRepository } from './repository.js';
import type { FinanceReport } from './types.js';

/** Creates a real, in-memory {@link FinanceReportRepository}. */
export function createFinanceReportRepository(seed?: readonly FinanceReport[]): FinanceReportRepository {
  const repo = createInMemoryRepository<FinanceReport>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByType(organizationId, reportType) {
      return repo.list(organizationId).filter((report) => report.reportType === reportType);
    },
  };
}
