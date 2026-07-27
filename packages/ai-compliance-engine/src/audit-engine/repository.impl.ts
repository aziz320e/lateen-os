/** Real, in-memory {@link ComplianceAuditRepository} implementation. @module audit-engine/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ComplianceAuditRepository } from './repository.js';
import type { ComplianceAudit } from './types.js';

/** Creates a real, in-memory {@link ComplianceAuditRepository}. */
export function createComplianceAuditRepository(seed?: readonly ComplianceAudit[]): ComplianceAuditRepository {
  const repo = createInMemoryRepository<ComplianceAudit>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByFrameworkId(organizationId, frameworkId) {
      return repo.list(organizationId).filter((audit) => audit.frameworkId === frameworkId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((audit) => audit.status === status);
    },
  };
}
