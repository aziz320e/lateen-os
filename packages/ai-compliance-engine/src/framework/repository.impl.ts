/** Real, in-memory Compliance Framework repositories. @module framework/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ComplianceFrameworkRepository, ComplianceFrameworkVersionRepository } from './repository.js';
import type { ComplianceFramework, ComplianceFrameworkVersion } from './types.js';

/** Creates a real, in-memory {@link ComplianceFrameworkRepository}. */
export function createComplianceFrameworkRepository(seed?: readonly ComplianceFramework[]): ComplianceFrameworkRepository {
  const repo = createInMemoryRepository<ComplianceFramework>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCode(organizationId, frameworkCode) {
      return repo.list(organizationId).filter((framework) => framework.frameworkCode === frameworkCode);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((framework) => framework.status === status);
    },
  };
}

/** Creates a real, in-memory {@link ComplianceFrameworkVersionRepository}. */
export function createComplianceFrameworkVersionRepository(seed?: readonly ComplianceFrameworkVersion[]): ComplianceFrameworkVersionRepository {
  const repo = createInMemoryRepository<ComplianceFrameworkVersion>({ seed });
  return {
    ...repo,
    async findByFrameworkId(organizationId, frameworkId) {
      return repo.list(organizationId)
        .filter((version) => version.frameworkId === frameworkId)
        .sort((a, b) => a.version - b.version);
    },
  };
}
