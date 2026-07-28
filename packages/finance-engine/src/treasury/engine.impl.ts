/**
 * Real Treasury engine — cash and bank accounts (unified as
 * {@link CashAccount} with an `accountSubtype`), deposits,
 * withdrawals, transfers between accounts, and bank reconciliation.
 *
 * @module treasury/engine.impl
 */
import { addAmounts, compareAmounts, subtractAmounts } from '../shared/decimal.js';
import type { FinanceEventBus } from '../events/finance-event-bus.js';
import { CashAccountNotFoundError, InsufficientFundsError, ReconciliationDiscrepancyError, ReconciliationNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { CashAccountId, OrganizationId, ReconciliationId, TreasuryTransactionId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate, ISODateTime } from '../shared/primitives.js';
import type { CashAccountRepository, ReconciliationRepository, TreasuryTransactionRepository } from './repository.js';
import type { CashAccount, CashAccountSubtype, Reconciliation, TreasuryTransaction } from './types.js';

export interface CreateCashAccountInput {
  readonly name: string;
  readonly accountSubtype: CashAccountSubtype;
  readonly currency: CurrencyCode;
  readonly bankName?: string;
  readonly accountNumber?: string;
  readonly openingBalance?: string;
}

export interface RecordTreasuryMovementInput {
  readonly amount: string;
  readonly occurredAt?: ISODateTime;
  readonly memo?: string;
}

export interface TreasuryEngine {
  createCashAccount(organizationId: OrganizationId, input: CreateCashAccountInput): Promise<CashAccount>;
  activateCashAccount(organizationId: OrganizationId, cashAccountId: CashAccountId): Promise<CashAccount>;
  deactivateCashAccount(organizationId: OrganizationId, cashAccountId: CashAccountId): Promise<CashAccount>;
  getCashAccount(organizationId: OrganizationId, cashAccountId: CashAccountId): Promise<CashAccount | null>;
  listCashAccounts(organizationId: OrganizationId): Promise<readonly CashAccount[]>;

  recordDeposit(organizationId: OrganizationId, cashAccountId: CashAccountId, input: RecordTreasuryMovementInput): Promise<TreasuryTransaction>;
  /** Throws {@link InsufficientFundsError} if the account's balance is below the requested amount. */
  recordWithdrawal(organizationId: OrganizationId, cashAccountId: CashAccountId, input: RecordTreasuryMovementInput): Promise<TreasuryTransaction>;
  /** Throws {@link InsufficientFundsError} if the source account's balance is below the requested amount. */
  recordTransfer(
    organizationId: OrganizationId,
    fromCashAccountId: CashAccountId,
    toCashAccountId: CashAccountId,
    input: RecordTreasuryMovementInput,
  ): Promise<TreasuryTransaction>;
  getTransaction(organizationId: OrganizationId, transactionId: TreasuryTransactionId): Promise<TreasuryTransaction | null>;
  listTransactions(organizationId: OrganizationId): Promise<readonly TreasuryTransaction[]>;
  findByCashAccount(organizationId: OrganizationId, cashAccountId: CashAccountId): Promise<readonly TreasuryTransaction[]>;

  /** Snapshots the account's current book balance against a statement balance, matching every unreconciled transaction as of `asOf`. */
  startReconciliation(organizationId: OrganizationId, cashAccountId: CashAccountId, statementBalance: string, asOf: ISODate): Promise<Reconciliation>;
  /** Marks every matched transaction reconciled. Throws {@link ReconciliationDiscrepancyError} unless the discrepancy is zero. */
  completeReconciliation(organizationId: OrganizationId, reconciliationId: ReconciliationId): Promise<Reconciliation>;
  getReconciliation(organizationId: OrganizationId, reconciliationId: ReconciliationId): Promise<Reconciliation | null>;
  listReconciliations(organizationId: OrganizationId): Promise<readonly Reconciliation[]>;
}

/** Creates a real {@link TreasuryEngine}. */
export function createTreasuryEngine(
  cashAccountRepository: CashAccountRepository,
  transactionRepository: TreasuryTransactionRepository,
  reconciliationRepository: ReconciliationRepository,
  eventBus?: FinanceEventBus,
  now: () => string = nowIso,
): TreasuryEngine {
  async function requireCashAccount(organizationId: OrganizationId, cashAccountId: CashAccountId): Promise<CashAccount> {
    const account = await cashAccountRepository.findById(organizationId, cashAccountId);
    if (!account) throw new CashAccountNotFoundError(cashAccountId);
    return account;
  }

  async function requireReconciliation(organizationId: OrganizationId, reconciliationId: ReconciliationId): Promise<Reconciliation> {
    const reconciliation = await reconciliationRepository.findById(organizationId, reconciliationId);
    if (!reconciliation) throw new ReconciliationNotFoundError(reconciliationId);
    return reconciliation;
  }

  return {
    async createCashAccount(organizationId, input) {
      const timestamp = now();
      const account: CashAccount = {
        id: generateId('cash-account'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        accountSubtype: input.accountSubtype,
        currency: input.currency,
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        balance: input.openingBalance ?? '0.00',
        status: 'active',
      };
      await cashAccountRepository.save(account);
      return account;
    },

    async activateCashAccount(organizationId, cashAccountId) {
      const account = await requireCashAccount(organizationId, cashAccountId);
      const updated: CashAccount = { ...account, status: 'active', updatedAt: now() };
      await cashAccountRepository.save(updated);
      return updated;
    },

    async deactivateCashAccount(organizationId, cashAccountId) {
      const account = await requireCashAccount(organizationId, cashAccountId);
      const updated: CashAccount = { ...account, status: 'inactive', updatedAt: now() };
      await cashAccountRepository.save(updated);
      return updated;
    },

    async getCashAccount(organizationId, cashAccountId) {
      return cashAccountRepository.findById(organizationId, cashAccountId);
    },

    async listCashAccounts(organizationId) {
      return cashAccountRepository.findAll(organizationId);
    },

    async recordDeposit(organizationId, cashAccountId, input) {
      const account = await requireCashAccount(organizationId, cashAccountId);
      const timestamp = now();
      const updated: CashAccount = { ...account, balance: addAmounts(account.balance, input.amount), updatedAt: timestamp };
      await cashAccountRepository.save(updated);
      const transaction: TreasuryTransaction = {
        id: generateId('treasury-transaction'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        transactionType: 'deposit',
        amount: input.amount,
        currency: account.currency,
        toCashAccountId: cashAccountId,
        occurredAt: input.occurredAt ?? timestamp,
        memo: input.memo,
        reconciled: false,
      };
      await transactionRepository.save(transaction);
      return transaction;
    },

    async recordWithdrawal(organizationId, cashAccountId, input) {
      const account = await requireCashAccount(organizationId, cashAccountId);
      if (compareAmounts(input.amount, account.balance) === 1) {
        throw new InsufficientFundsError(cashAccountId, input.amount, account.balance);
      }
      const timestamp = now();
      const updated: CashAccount = { ...account, balance: subtractAmounts(account.balance, input.amount), updatedAt: timestamp };
      await cashAccountRepository.save(updated);
      const transaction: TreasuryTransaction = {
        id: generateId('treasury-transaction'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        transactionType: 'withdrawal',
        amount: input.amount,
        currency: account.currency,
        fromCashAccountId: cashAccountId,
        occurredAt: input.occurredAt ?? timestamp,
        memo: input.memo,
        reconciled: false,
      };
      await transactionRepository.save(transaction);
      return transaction;
    },

    async recordTransfer(organizationId, fromCashAccountId, toCashAccountId, input) {
      const fromAccount = await requireCashAccount(organizationId, fromCashAccountId);
      const toAccount = await requireCashAccount(organizationId, toCashAccountId);
      if (compareAmounts(input.amount, fromAccount.balance) === 1) {
        throw new InsufficientFundsError(fromCashAccountId, input.amount, fromAccount.balance);
      }
      const timestamp = now();
      await cashAccountRepository.save({ ...fromAccount, balance: subtractAmounts(fromAccount.balance, input.amount), updatedAt: timestamp });
      await cashAccountRepository.save({ ...toAccount, balance: addAmounts(toAccount.balance, input.amount), updatedAt: timestamp });
      const transaction: TreasuryTransaction = {
        id: generateId('treasury-transaction'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        transactionType: 'transfer',
        amount: input.amount,
        currency: fromAccount.currency,
        fromCashAccountId,
        toCashAccountId,
        occurredAt: input.occurredAt ?? timestamp,
        memo: input.memo,
        reconciled: false,
      };
      await transactionRepository.save(transaction);
      return transaction;
    },

    async getTransaction(organizationId, transactionId) {
      return transactionRepository.findById(organizationId, transactionId);
    },

    async listTransactions(organizationId) {
      return transactionRepository.findAll(organizationId);
    },

    async findByCashAccount(organizationId, cashAccountId) {
      return transactionRepository.findByCashAccount(organizationId, cashAccountId);
    },

    async startReconciliation(organizationId, cashAccountId, statementBalance, asOf) {
      const account = await requireCashAccount(organizationId, cashAccountId);
      const transactions = (await transactionRepository.findByCashAccount(organizationId, cashAccountId)).filter(
        (tx) => !tx.reconciled && tx.occurredAt <= asOf,
      );
      const bookBalance = account.balance;
      const timestamp = now();
      const reconciliation: Reconciliation = {
        id: generateId('reconciliation'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        cashAccountId,
        statementBalance,
        bookBalance,
        discrepancy: subtractAmounts(statementBalance, bookBalance),
        asOf,
        matchedTransactionIds: transactions.map((tx) => tx.id),
        status: 'draft',
      };
      await reconciliationRepository.save(reconciliation);
      return reconciliation;
    },

    async completeReconciliation(organizationId, reconciliationId) {
      const reconciliation = await requireReconciliation(organizationId, reconciliationId);
      if (compareAmounts(reconciliation.discrepancy, '0') !== 0) {
        throw new ReconciliationDiscrepancyError(reconciliationId, reconciliation.discrepancy);
      }
      for (const transactionId of reconciliation.matchedTransactionIds) {
        const transaction = await transactionRepository.findById(organizationId, transactionId);
        if (transaction) await transactionRepository.save({ ...transaction, reconciled: true, updatedAt: now() });
      }
      const updated: Reconciliation = { ...reconciliation, status: 'completed', updatedAt: now() };
      await reconciliationRepository.save(updated);
      return updated;
    },

    async getReconciliation(organizationId, reconciliationId) {
      return reconciliationRepository.findById(organizationId, reconciliationId);
    },

    async listReconciliations(organizationId) {
      return reconciliationRepository.findAll(organizationId);
    },
  };
}
