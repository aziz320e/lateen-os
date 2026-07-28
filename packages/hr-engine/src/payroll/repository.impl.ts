/** Real, in-memory Payroll Preparation repository. @module payroll/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { PayrollRunRepository } from './repository.js';
import type { PayrollRun } from './types.js';

/** Creates a real, in-memory {@link PayrollRunRepository}. */
export function createPayrollRunRepository(seed?: readonly PayrollRun[]): PayrollRunRepository {
  const repo = createInMemoryRepository<PayrollRun>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((run) => run.status === status);
    },
  };
}
