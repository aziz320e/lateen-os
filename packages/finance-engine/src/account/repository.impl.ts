/** Real, in-memory Chart of Accounts repository. @module account/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AccountRepository } from './repository.js';
import type { Account } from './types.js';

/** Creates a real, in-memory {@link AccountRepository}. */
export function createAccountRepository(seed?: readonly Account[]): AccountRepository {
  const repo = createInMemoryRepository<Account>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByType(organizationId, accountType) {
      return repo.list(organizationId).filter((account) => account.accountType === accountType);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((account) => account.status === status);
    },
    async findByParent(organizationId, parentAccountId) {
      return repo.list(organizationId).filter((account) => account.parentAccountId === parentAccountId);
    },
    async findByCode(organizationId, code) {
      return repo.list(organizationId).find((account) => account.code === code) ?? null;
    },
  };
}
