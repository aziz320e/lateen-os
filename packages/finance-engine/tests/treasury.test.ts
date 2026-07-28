import { describe, expect, it } from 'vitest';
import { createTreasuryEngine } from '../src/treasury/engine.impl.js';
import { createCashAccountRepository, createReconciliationRepository, createTreasuryTransactionRepository } from '../src/treasury/repository.impl.js';
import { CashAccountNotFoundError, InsufficientFundsError, ReconciliationDiscrepancyError, ReconciliationNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const cashAccountRepository = createCashAccountRepository();
  const transactionRepository = createTreasuryTransactionRepository();
  const reconciliationRepository = createReconciliationRepository();
  const engine = createTreasuryEngine(cashAccountRepository, transactionRepository, reconciliationRepository);
  return { cashAccountRepository, transactionRepository, reconciliationRepository, engine };
}

describe('TreasuryEngine — cash accounts', () => {
  it('createCashAccount() defaults balance to 0.00 and status active', async () => {
    const { engine } = setup();
    const account = await engine.createCashAccount(ORG, { name: 'Main Checking', accountSubtype: 'bank', currency: 'USD' });
    expect(account.balance).toBe('0.00');
    expect(account.status).toBe('active');
  });

  it('createCashAccount() honors an opening balance', async () => {
    const { engine } = setup();
    const account = await engine.createCashAccount(ORG, { name: 'Petty Cash', accountSubtype: 'cash', currency: 'USD', openingBalance: '500.00' });
    expect(account.balance).toBe('500.00');
  });

  it('activate()/deactivate() toggle status', async () => {
    const { engine } = setup();
    const account = await engine.createCashAccount(ORG, { name: 'Main', accountSubtype: 'bank', currency: 'USD' });
    const deactivated = await engine.deactivateCashAccount(ORG, account.id);
    expect(deactivated.status).toBe('inactive');
    const activated = await engine.activateCashAccount(ORG, account.id);
    expect(activated.status).toBe('active');
  });

  it('throws CashAccountNotFoundError for an unknown account', async () => {
    const { engine } = setup();
    await expect(engine.activateCashAccount(ORG, 'missing')).rejects.toBeInstanceOf(CashAccountNotFoundError);
  });
});

describe('TreasuryEngine — deposits and withdrawals', () => {
  it('recordDeposit() increases the balance and records a deposit transaction', async () => {
    const { engine } = setup();
    const account = await engine.createCashAccount(ORG, { name: 'Main', accountSubtype: 'bank', currency: 'USD' });
    const tx = await engine.recordDeposit(ORG, account.id, { amount: '250.00' });
    expect(tx.transactionType).toBe('deposit');
    const updated = await engine.getCashAccount(ORG, account.id);
    expect(updated?.balance).toBe('250.00');
  });

  it('recordWithdrawal() decreases the balance', async () => {
    const { engine } = setup();
    const account = await engine.createCashAccount(ORG, { name: 'Main', accountSubtype: 'bank', currency: 'USD', openingBalance: '100.00' });
    await engine.recordWithdrawal(ORG, account.id, { amount: '40.00' });
    const updated = await engine.getCashAccount(ORG, account.id);
    expect(updated?.balance).toBe('60.00');
  });

  it('recordWithdrawal() throws InsufficientFundsError when overdrawing', async () => {
    const { engine } = setup();
    const account = await engine.createCashAccount(ORG, { name: 'Main', accountSubtype: 'bank', currency: 'USD', openingBalance: '10.00' });
    await expect(engine.recordWithdrawal(ORG, account.id, { amount: '20.00' })).rejects.toBeInstanceOf(InsufficientFundsError);
  });
});

describe('TreasuryEngine — transfers', () => {
  it('recordTransfer() moves funds between two accounts', async () => {
    const { engine } = setup();
    const from = await engine.createCashAccount(ORG, { name: 'Checking', accountSubtype: 'bank', currency: 'USD', openingBalance: '200.00' });
    const to = await engine.createCashAccount(ORG, { name: 'Savings', accountSubtype: 'bank', currency: 'USD' });
    const tx = await engine.recordTransfer(ORG, from.id, to.id, { amount: '75.00' });
    expect(tx.transactionType).toBe('transfer');
    expect((await engine.getCashAccount(ORG, from.id))?.balance).toBe('125.00');
    expect((await engine.getCashAccount(ORG, to.id))?.balance).toBe('75.00');
  });

  it('recordTransfer() throws InsufficientFundsError when the source lacks funds', async () => {
    const { engine } = setup();
    const from = await engine.createCashAccount(ORG, { name: 'Checking', accountSubtype: 'bank', currency: 'USD' });
    const to = await engine.createCashAccount(ORG, { name: 'Savings', accountSubtype: 'bank', currency: 'USD' });
    await expect(engine.recordTransfer(ORG, from.id, to.id, { amount: '10.00' })).rejects.toBeInstanceOf(InsufficientFundsError);
  });

  it('findByCashAccount() returns transactions touching either side', async () => {
    const { engine } = setup();
    const from = await engine.createCashAccount(ORG, { name: 'Checking', accountSubtype: 'bank', currency: 'USD', openingBalance: '200.00' });
    const to = await engine.createCashAccount(ORG, { name: 'Savings', accountSubtype: 'bank', currency: 'USD' });
    await engine.recordTransfer(ORG, from.id, to.id, { amount: '50.00' });
    expect(await engine.findByCashAccount(ORG, from.id)).toHaveLength(1);
    expect(await engine.findByCashAccount(ORG, to.id)).toHaveLength(1);
  });
});

describe('TreasuryEngine — listing and org scoping', () => {
  it('listCashAccounts() and getCashAccount() round-trip', async () => {
    const { engine } = setup();
    const account = await engine.createCashAccount(ORG, { name: 'Main', accountSubtype: 'bank', currency: 'USD' });
    expect(await engine.listCashAccounts(ORG)).toHaveLength(1);
    expect(await engine.getCashAccount(ORG, account.id)).toEqual(account);
  });

  it('getTransaction() returns null for an unknown transaction', async () => {
    const { engine } = setup();
    expect(await engine.getTransaction(ORG, 'missing')).toBeNull();
  });

  it('listTransactions() is organization-scoped', async () => {
    const { engine } = setup();
    const account = await engine.createCashAccount(ORG, { name: 'Main', accountSubtype: 'bank', currency: 'USD' });
    await engine.recordDeposit(ORG, account.id, { amount: '10.00' });
    expect(await engine.listTransactions(ORG)).toHaveLength(1);
    expect(await engine.listTransactions('org-2')).toHaveLength(0);
  });
});

describe('TreasuryEngine — reconciliation', () => {
  it('startReconciliation() computes discrepancy against the book balance', async () => {
    const { engine } = setup();
    const account = await engine.createCashAccount(ORG, { name: 'Main', accountSubtype: 'bank', currency: 'USD' });
    await engine.recordDeposit(ORG, account.id, { amount: '100.00', occurredAt: '2026-01-05' });
    const reconciliation = await engine.startReconciliation(ORG, account.id, '100.00', '2026-01-31');
    expect(reconciliation.bookBalance).toBe('100.00');
    expect(reconciliation.discrepancy).toBe('0.00');
    expect(reconciliation.matchedTransactionIds).toHaveLength(1);
  });

  it('completeReconciliation() marks matched transactions reconciled', async () => {
    const { engine, transactionRepository } = setup();
    const account = await engine.createCashAccount(ORG, { name: 'Main', accountSubtype: 'bank', currency: 'USD' });
    const tx = await engine.recordDeposit(ORG, account.id, { amount: '100.00', occurredAt: '2026-01-05' });
    const reconciliation = await engine.startReconciliation(ORG, account.id, '100.00', '2026-01-31');
    const completed = await engine.completeReconciliation(ORG, reconciliation.id);
    expect(completed.status).toBe('completed');
    const stored = await transactionRepository.findById(ORG, tx.id);
    expect(stored?.reconciled).toBe(true);
  });

  it('completeReconciliation() throws ReconciliationDiscrepancyError on mismatch', async () => {
    const { engine } = setup();
    const account = await engine.createCashAccount(ORG, { name: 'Main', accountSubtype: 'bank', currency: 'USD' });
    await engine.recordDeposit(ORG, account.id, { amount: '100.00', occurredAt: '2026-01-05' });
    const reconciliation = await engine.startReconciliation(ORG, account.id, '90.00', '2026-01-31');
    await expect(engine.completeReconciliation(ORG, reconciliation.id)).rejects.toBeInstanceOf(ReconciliationDiscrepancyError);
  });

  it('throws ReconciliationNotFoundError for an unknown reconciliation', async () => {
    const { engine } = setup();
    await expect(engine.completeReconciliation(ORG, 'missing')).rejects.toBeInstanceOf(ReconciliationNotFoundError);
  });

  it('listReconciliations() is organization-scoped', async () => {
    const { engine } = setup();
    const account = await engine.createCashAccount(ORG, { name: 'Main', accountSubtype: 'bank', currency: 'USD' });
    await engine.startReconciliation(ORG, account.id, '0.00', '2026-01-31');
    expect(await engine.listReconciliations(ORG)).toHaveLength(1);
    expect(await engine.listReconciliations('org-2')).toHaveLength(0);
  });

  it('getReconciliation() returns null for an unknown reconciliation', async () => {
    const { engine } = setup();
    expect(await engine.getReconciliation(ORG, 'missing')).toBeNull();
  });

  it('only matches unreconciled transactions at or before asOf', async () => {
    const { engine } = setup();
    const account = await engine.createCashAccount(ORG, { name: 'Main', accountSubtype: 'bank', currency: 'USD' });
    await engine.recordDeposit(ORG, account.id, { amount: '50.00', occurredAt: '2026-01-05' });
    await engine.recordDeposit(ORG, account.id, { amount: '30.00', occurredAt: '2026-02-05' });
    const reconciliation = await engine.startReconciliation(ORG, account.id, '80.00', '2026-01-31');
    expect(reconciliation.matchedTransactionIds).toHaveLength(1);
  });
});
