import { describe, expect, it } from 'vitest';
import { createFinanceRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('createFinanceRuntime', () => {
  it('wires every module together and works fully offline', async () => {
    const runtime = createFinanceRuntime();

    const account = await runtime.chartOfAccounts.create(ORG, { code: '1000', name: 'Cash', accountType: 'asset' });
    expect(account.status).toBe('draft');

    const fiscalYear = await runtime.financialOrganization.createFiscalYear(ORG, { name: 'FY2026', startDate: '2026-01-01', endDate: '2026-12-31' });
    expect(fiscalYear.status).toBe('open');

    expect(await runtime.relationships.getBusinessProfileContext(ORG)).toBeNull();
  });

  it('shares one event bus across every engine by default', async () => {
    const runtime = createFinanceRuntime();
    let seen: unknown;
    runtime.events.subscribe('account.created', (payload) => (seen = payload));
    const account = await runtime.chartOfAccounts.create(ORG, { code: '1000', name: 'Cash', accountType: 'asset' });
    expect(seen).toEqual({ organizationId: ORG, accountId: account.id, accountType: 'asset' });
  });

  it('accepts an injected event bus and clock', async () => {
    const { createFinanceEventBus } = await import('../src/events/index.js');
    const eventBus = createFinanceEventBus();
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const runtime = createFinanceRuntime({ eventBus, now: fixedNow });
    const account = await runtime.chartOfAccounts.create(ORG, { code: '1000', name: 'Cash', accountType: 'asset' });
    expect(account.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(runtime.events).toBe(eventBus);
  });

  it('queries reflect state mutated through the engines', async () => {
    const runtime = createFinanceRuntime();
    await runtime.chartOfAccounts.create(ORG, { code: '1000', name: 'Cash', accountType: 'asset' });
    const result = await runtime.queries.findAccounts({ organizationId: ORG });
    expect(result.total).toBe(1);
  });

  it('budgets.computeActualVsBudget() sees journal entries posted through generalLedger', async () => {
    const runtime = createFinanceRuntime();
    const account = await runtime.chartOfAccounts.create(ORG, { code: '5000', name: 'Expense', accountType: 'expense' });
    const budget = await runtime.budgets.createBudget(ORG, {
      name: 'B',
      scope: 'annual',
      fiscalYearId: 'fy-1',
      currency: 'USD',
      lines: [{ accountId: account.id, plannedAmount: '100.00' }],
    });
    const entry = await runtime.generalLedger.createJournalEntry(ORG, {
      entryDate: '2026-01-15',
      currency: 'USD',
      lines: [
        { accountId: account.id, debit: '40.00', credit: '0.00' },
        { accountId: 'cash', debit: '0.00', credit: '40.00' },
      ],
    });
    await runtime.generalLedger.postJournalEntry(ORG, entry.id);
    const variance = await runtime.budgets.computeActualVsBudget(ORG, budget.id, '2026-01-01', '2026-12-31');
    expect(variance.lines[0]?.actualAmount).toBe('40.00');
  });

  it('reports.generateARAgingReport() sees invoices created through accountsReceivable', async () => {
    const runtime = createFinanceRuntime();
    const customer = await runtime.accountsReceivable.createCustomer(ORG, { displayName: 'Acme', currency: 'USD', paymentTermsDays: 5 });
    const invoice = await runtime.accountsReceivable.createInvoice(ORG, {
      customerId: customer.id,
      currency: 'USD',
      lines: [{ description: 'x', quantity: '1', unitPrice: '200.00' }],
    });
    await runtime.accountsReceivable.issueInvoice(ORG, invoice.id, '2026-01-01');
    const report = await runtime.reports.generateARAgingReport(ORG, '2026-02-01');
    expect(report.reportType).toBe('ar_aging');
  });
});
