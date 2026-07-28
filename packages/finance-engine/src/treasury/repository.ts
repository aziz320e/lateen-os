/** @module treasury/repository */
import type { Repository } from '../shared/repository.js';
import type { CashAccountId, OrganizationId, ReconciliationId, TreasuryTransactionId } from '../shared/identifiers.js';
import type { CashAccount, Reconciliation, TreasuryTransaction } from './types.js';

export interface CashAccountRepository extends Repository<CashAccount, CashAccountId> {
  findAll(organizationId: OrganizationId): Promise<readonly CashAccount[]>;
}

export interface TreasuryTransactionRepository extends Repository<TreasuryTransaction, TreasuryTransactionId> {
  findAll(organizationId: OrganizationId): Promise<readonly TreasuryTransaction[]>;
  findByCashAccount(organizationId: OrganizationId, cashAccountId: CashAccountId): Promise<readonly TreasuryTransaction[]>;
}

export interface ReconciliationRepository extends Repository<Reconciliation, ReconciliationId> {
  findAll(organizationId: OrganizationId): Promise<readonly Reconciliation[]>;
  findByCashAccount(organizationId: OrganizationId, cashAccountId: CashAccountId): Promise<readonly Reconciliation[]>;
}
