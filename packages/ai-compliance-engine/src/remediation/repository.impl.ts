/** Real, in-memory {@link RemediationRepository} implementation. @module remediation/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { RemediationRepository } from './repository.js';
import type { Remediation } from './types.js';

/** Creates a real, in-memory {@link RemediationRepository}. */
export function createRemediationRepository(seed?: readonly Remediation[]): RemediationRepository {
  const repo = createInMemoryRepository<Remediation>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((remediation) => remediation.status === status);
    },
    async findByReferenceId(organizationId, referenceId) {
      return repo.list(organizationId).filter((remediation) => remediation.referenceId === referenceId);
    },
    async findByFrameworkId(organizationId, frameworkId) {
      return repo.list(organizationId).filter((remediation) => remediation.frameworkId === frameworkId);
    },
  };
}
