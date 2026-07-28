/** Real, in-memory Renewals repository. @module renewal/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { RenewalRepository } from './repository.js';
import type { Renewal } from './types.js';

/** Creates a real, in-memory {@link RenewalRepository}. */
export function createRenewalRepository(seed?: readonly Renewal[]): RenewalRepository {
  const repo = createInMemoryRepository<Renewal>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCustomer(organizationId, customerId) {
      return repo.list(organizationId).filter((renewal) => renewal.customerId === customerId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((renewal) => renewal.status === status);
    },
  };
}
