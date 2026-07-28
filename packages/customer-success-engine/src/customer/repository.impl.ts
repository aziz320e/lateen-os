/** Real, in-memory Customer Lifecycle repository. @module customer/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { CustomerSuccessRecordRepository } from './repository.js';
import type { CustomerSuccessRecord } from './types.js';

/** Creates a real, in-memory {@link CustomerSuccessRecordRepository}. */
export function createCustomerSuccessRecordRepository(seed?: readonly CustomerSuccessRecord[]): CustomerSuccessRecordRepository {
  const repo = createInMemoryRepository<CustomerSuccessRecord>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCustomer(organizationId, customerId) {
      return repo.list(organizationId).find((record) => record.customerId === customerId) ?? null;
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((record) => record.status === status);
    },
  };
}
