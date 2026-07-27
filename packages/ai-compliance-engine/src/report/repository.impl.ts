/** Real, in-memory {@link ComplianceReportRepository} implementation. @module report/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ComplianceReportRepository } from './repository.js';
import type { ComplianceReport } from './types.js';

/** Creates a real, in-memory {@link ComplianceReportRepository}. */
export function createComplianceReportRepository(seed?: readonly ComplianceReport[]): ComplianceReportRepository {
  const repo = createInMemoryRepository<ComplianceReport>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByFrameworkId(organizationId, frameworkId) {
      return repo.list(organizationId).filter((report) => report.frameworkId === frameworkId);
    },
  };
}
