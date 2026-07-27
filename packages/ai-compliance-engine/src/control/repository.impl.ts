/** Real, in-memory {@link ComplianceControlRepository} implementation. @module control/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ComplianceControlRepository } from './repository.js';
import type { ComplianceControl } from './types.js';

/** Creates a real, in-memory {@link ComplianceControlRepository}. */
export function createComplianceControlRepository(seed?: readonly ComplianceControl[]): ComplianceControlRepository {
  const repo = createInMemoryRepository<ComplianceControl>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByFrameworkId(organizationId, frameworkId) {
      return repo.list(organizationId).filter((control) => control.frameworkId === frameworkId);
    },
    async findByType(organizationId, controlType) {
      return repo.list(organizationId).filter((control) => control.controlType === controlType);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((control) => control.status === status);
    },
  };
}
