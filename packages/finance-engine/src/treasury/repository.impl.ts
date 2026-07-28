/** Real, in-memory Treasury repositories. @module treasury/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { CashAccountRepository, ReconciliationRepository, TreasuryTransactionRepository } from './repository.js';
import type { CashAccount, Reconciliation, TreasuryTransaction } from './types.js';

/** Creates a real, in-memory {@link CashAccountRepository}. */
export function createCashAccountRepository(seed?: readonly CashAccount[]): CashAccountRepository {
  const repo = createInMemoryRepository<CashAccount>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link TreasuryTransactionRepository}. */
export function createTreasuryTransactionRepository(seed?: readonly TreasuryTransaction[]): TreasuryTransactionRepository {
  const repo = createInMemoryRepository<TreasuryTransaction>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCashAccount(organizationId, cashAccountId) {
      return repo.list(organizationId).filter((tx) => tx.fromCashAccountId === cashAccountId || tx.toCashAccountId === cashAccountId);
    },
  };
}

/** Creates a real, in-memory {@link ReconciliationRepository}. */
export function createReconciliationRepository(seed?: readonly Reconciliation[]): ReconciliationRepository {
  const repo = createInMemoryRepository<Reconciliation>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCashAccount(organizationId, cashAccountId) {
      return repo.list(organizationId).filter((reconciliation) => reconciliation.cashAccountId === cashAccountId);
    },
  };
}
