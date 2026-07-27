/** Real, in-memory {@link AccountRepository} implementation. @module account/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Account } from './types.js';
import type { AccountRepository } from './repository.js';

/** Creates a real, in-memory {@link AccountRepository}. */
export function createAccountRepository(seed?: readonly Account[]): AccountRepository {
  const repo = createInMemoryRepository<Account>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((account) => account.status === status);
    },
    async findByName(organizationId, name) {
      return repo.list(organizationId).find((account) => account.name === name) ?? null;
    },
  };
}
