/** Real, in-memory {@link ContactRepository} implementation. @module contact/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Contact } from './types.js';
import type { ContactRepository } from './repository.js';

/** Creates a real, in-memory {@link ContactRepository}. */
export function createContactRepository(seed?: readonly Contact[]): ContactRepository {
  const repo = createInMemoryRepository<Contact>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((contact) => contact.status === status);
    },
    async findByEmail(organizationId, email) {
      return repo.list(organizationId).find((contact) => contact.email === email) ?? null;
    },
    async findByCustomer(organizationId, customerId) {
      return repo.list(organizationId).filter((contact) => contact.customerId === customerId);
    },
    async findByAccount(organizationId, accountId) {
      return repo.list(organizationId).filter((contact) => contact.accountId === accountId);
    },
  };
}
