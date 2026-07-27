/** Real, in-memory {@link CustomerRepository} implementation. @module customer/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Customer } from './types.js';
import type { CustomerRepository } from './repository.js';

/** Creates a real, in-memory {@link CustomerRepository}. */
export function createCustomerRepository(seed?: readonly Customer[]): CustomerRepository {
  const repo = createInMemoryRepository<Customer>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((customer) => customer.status === status);
    },
    async findByEmail(organizationId, email) {
      return repo.list(organizationId).find((customer) => customer.email === email) ?? null;
    },
    async findByPhone(organizationId, phone) {
      return repo.list(organizationId).find((customer) => customer.phone === phone) ?? null;
    },
  };
}
