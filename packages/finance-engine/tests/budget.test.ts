import { describe, expect, it } from 'vitest';
import { createAccountRepository } from '../src/account/repository.impl.js';
import type { Account } from '../src/account/types.js';
import { canTransitionBudget, computeVariance, createBudgetEngine } from '../src/budget/engine.impl.js';
import { createBudgetRepository, createBudgetRevisionRepository } from '../src/budget/repository.impl.js';
import { createFinanceEventBus } from '../src/events/index.js';
import { createJournalEntryRepository, createRecurringJournalTemplateRepository } from '../src/journal-entry/repository.impl.js';
import { createGeneralLedgerEngine } from '../src/journal-entry/engine.impl.js';
import { BudgetNotFoundError, InvalidBudgetTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createFinanceEventBus()) {
  const budgetRepository = createBudgetRepository();
  const revisionRepository = createBudgetRevisionRepository();
  const journalEntryRepository = createJournalEntryRepository();
  const recurringTemplateRepository = createRecurringJournalTemplateRepository();
  const accountRepository = createAccountRepository();
  const generalLedger = createGeneralLedgerEngine(journalEntryRepository, recurringTemplateRepository);
  const engine = createBudgetEngine(budgetRepository, revisionRepository, journalEntryRepository, accountRepository, eventBus);
  return { budgetRepository, revisionRepository, journalEntryRepository, accountRepository, generalLedger, engine, eventBus };
}

describe('computeVariance (pure)', () => {
  it('computes variance and variance percentage', () => {
    const { variance, variancePct } = computeVariance('100.00', '120.00');
    expect(variance).toBe('20.00');
    expect(variancePct).toBe('20.00');
  });

  it('is 0% when planned is 0', () => {
    const { variancePct } = computeVariance('0.00', '50.00');
    expect(variancePct).toBe('0.00');
  });

  it('is negative when under budget', () => {
    const { variance } = computeVariance('100.00', '80.00');
    expect(variance).toBe('-20.00');
  });
});

describe('canTransitionBudget (pure)', () => {
  it('allows draft -> approved', () => {
    expect(canTransitionBudget('draft', 'approved')).toBe(true);
  });

  it('allows approved -> revised and approved -> closed', () => {
    expect(canTransitionBudget('approved', 'revised')).toBe(true);
    expect(canTransitionBudget('approved', 'closed')).toBe(true);
  });

  it('rejects any transition out of closed', () => {
    expect(canTransitionBudget('closed', 'approved')).toBe(false);
  });
});

describe('BudgetEngine — lifecycle', () => {
  it('createBudget() starts draft at version 1 and snapshots a revision', async () => {
    const { engine } = setup();
    const budget = await engine.createBudget(ORG, {
      name: 'FY2026 Annual',
      scope: 'annual',
      fiscalYearId: 'fy-1',
      currency: 'USD',
      lines: [{ accountId: 'account-expense', plannedAmount: '10000.00' }],
    });
    expect(budget.status).toBe('draft');
    expect(budget.currentVersion).toBe(1);
    const history = await engine.getRevisionHistory(ORG, budget.id);
    expect(history).toHaveLength(1);
  });

  it('reviseBudget() bumps version, snapshots, and publishes budget.updated', async () => {
    const eventBus = createFinanceEventBus();
    const { engine } = setup(eventBus);
    const budget = await engine.createBudget(ORG, {
      name: 'FY2026 Annual',
      scope: 'annual',
      fiscalYearId: 'fy-1',
      currency: 'USD',
      lines: [{ accountId: 'account-expense', plannedAmount: '10000.00' }],
    });
    let seen: unknown;
    eventBus.subscribe('budget.updated', (payload) => (seen = payload));
    const revised = await engine.reviseBudget(ORG, budget.id, [{ accountId: 'account-expense', plannedAmount: '12000.00' }], 'increased scope');
    expect(revised.status).toBe('revised');
    expect(revised.currentVersion).toBe(2);
    expect(seen).toEqual({ organizationId: ORG, budgetId: budget.id });
    const history = await engine.getRevisionHistory(ORG, budget.id);
    expect(history).toHaveLength(2);
    expect(history[1]?.reason).toBe('increased scope');
  });

  it('approveBudget() moves draft -> approved', async () => {
    const { engine } = setup();
    const budget = await engine.createBudget(ORG, { name: 'B', scope: 'department', fiscalYearId: 'fy-1', currency: 'USD', lines: [] });
    const approved = await engine.approveBudget(ORG, budget.id);
    expect(approved.status).toBe('approved');
  });

  it('closeBudget() moves approved -> closed', async () => {
    const { engine } = setup();
    const budget = await engine.createBudget(ORG, { name: 'B', scope: 'project', fiscalYearId: 'fy-1', currency: 'USD', lines: [] });
    await engine.approveBudget(ORG, budget.id);
    const closed = await engine.closeBudget(ORG, budget.id);
    expect(closed.status).toBe('closed');
  });

  it('rejects revising a closed budget', async () => {
    const { engine } = setup();
    const budget = await engine.createBudget(ORG, { name: 'B', scope: 'annual', fiscalYearId: 'fy-1', currency: 'USD', lines: [] });
    await engine.approveBudget(ORG, budget.id);
    await engine.closeBudget(ORG, budget.id);
    await expect(engine.reviseBudget(ORG, budget.id, [])).rejects.toBeInstanceOf(InvalidBudgetTransitionError);
  });

  it('throws BudgetNotFoundError for an unknown budget', async () => {
    const { engine } = setup();
    await expect(engine.approveBudget(ORG, 'missing')).rejects.toBeInstanceOf(BudgetNotFoundError);
  });

  it('supports all three budget scopes', async () => {
    const { engine } = setup();
    for (const scope of ['annual', 'department', 'project'] as const) {
      const budget = await engine.createBudget(ORG, { name: scope, scope, fiscalYearId: 'fy-1', currency: 'USD', lines: [] });
      expect(budget.scope).toBe(scope);
    }
  });
});

describe('BudgetEngine — listing and org scoping', () => {
  it('getBudget()/listBudgets() round-trip', async () => {
    const { engine } = setup();
    const budget = await engine.createBudget(ORG, { name: 'B', scope: 'annual', fiscalYearId: 'fy-1', currency: 'USD', lines: [] });
    expect(await engine.getBudget(ORG, budget.id)).toEqual(budget);
    expect(await engine.listBudgets(ORG)).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { engine, budgetRepository } = setup();
    const budget = await engine.createBudget(ORG, { name: 'B', scope: 'annual', fiscalYearId: 'fy-1', currency: 'USD', lines: [] });
    expect(await budgetRepository.findById('org-2', budget.id)).toBeNull();
  });
});

describe('BudgetEngine — computeActualVsBudget', () => {
  it('computes actual spend from posted journal entries against the plan', async () => {
    const { engine, accountRepository, generalLedger } = setup();
    const expenseAccount: Account = {
      id: 'account-expense',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      code: '5000',
      name: 'Office Supplies',
      accountType: 'expense',
      normalBalance: 'debit',
      status: 'active',
      currentVersion: 1,
    };
    await accountRepository.save(expenseAccount);

    const budget = await engine.createBudget(ORG, {
      name: 'Office Supplies Budget',
      scope: 'department',
      fiscalYearId: 'fy-1',
      currency: 'USD',
      lines: [{ accountId: 'account-expense', plannedAmount: '1000.00' }],
    });

    const entry = await generalLedger.createJournalEntry(ORG, {
      entryDate: '2026-02-01',
      currency: 'USD',
      lines: [
        { accountId: 'account-expense', debit: '300.00', credit: '0.00' },
        { accountId: 'account-cash', debit: '0.00', credit: '300.00' },
      ],
    });
    await generalLedger.postJournalEntry(ORG, entry.id);

    const variance = await engine.computeActualVsBudget(ORG, budget.id, '2026-01-01', '2026-12-31');
    expect(variance.lines[0]?.actualAmount).toBe('300.00');
    expect(variance.lines[0]?.plannedAmount).toBe('1000.00');
    expect(variance.lines[0]?.variance).toBe('-700.00');
    expect(variance.totalActual).toBe('300.00');
  });

  it('ignores journal entries outside the requested period and unposted entries', async () => {
    const { engine, accountRepository, generalLedger } = setup();
    const expenseAccount: Account = {
      id: 'account-expense',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      code: '5000',
      name: 'Office Supplies',
      accountType: 'expense',
      normalBalance: 'debit',
      status: 'active',
      currentVersion: 1,
    };
    await accountRepository.save(expenseAccount);

    const budget = await engine.createBudget(ORG, {
      name: 'Office Supplies Budget',
      scope: 'department',
      fiscalYearId: 'fy-1',
      currency: 'USD',
      lines: [{ accountId: 'account-expense', plannedAmount: '1000.00' }],
    });

    const outOfRange = await generalLedger.createJournalEntry(ORG, {
      entryDate: '2025-01-01',
      currency: 'USD',
      lines: [
        { accountId: 'account-expense', debit: '50.00', credit: '0.00' },
        { accountId: 'account-cash', debit: '0.00', credit: '50.00' },
      ],
    });
    await generalLedger.postJournalEntry(ORG, outOfRange.id);

    await generalLedger.createJournalEntry(ORG, {
      entryDate: '2026-03-01',
      currency: 'USD',
      lines: [
        { accountId: 'account-expense', debit: '75.00', credit: '0.00' },
        { accountId: 'account-cash', debit: '0.00', credit: '75.00' },
      ],
    });

    const variance = await engine.computeActualVsBudget(ORG, budget.id, '2026-01-01', '2026-12-31');
    expect(variance.totalActual).toBe('0.00');
  });
});
