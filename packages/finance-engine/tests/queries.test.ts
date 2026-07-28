import { describe, expect, it } from 'vitest';
import { createAccountRepository } from '../src/account/repository.impl.js';
import { createChartOfAccountsEngine } from '../src/account/engine.impl.js';
import { createBillRepository } from '../src/accounts-payable/repository.impl.js';
import { createAccountsPayableEngine } from '../src/accounts-payable/engine.impl.js';
import { createAPPaymentRepository, createVendorCreditRepository, createVendorRepository } from '../src/accounts-payable/repository.impl.js';
import { createARInvoiceRepository } from '../src/accounts-receivable/repository.impl.js';
import { createAccountsReceivableEngine } from '../src/accounts-receivable/engine.impl.js';
import { createARCustomerRepository, createARPaymentRepository, createCreditNoteRepository } from '../src/accounts-receivable/repository.impl.js';
import { createBudgetEngine } from '../src/budget/engine.impl.js';
import { createBudgetRepository, createBudgetRevisionRepository } from '../src/budget/repository.impl.js';
import { createFinanceQueries } from '../src/queries/finance-queries.impl.js';
import { createFinanceReportEngine } from '../src/report/engine.impl.js';
import { createFinanceReportRepository } from '../src/report/repository.impl.js';
import { createTaxEngine } from '../src/tax/engine.impl.js';
import { createTaxCalculationRepository, createTaxRuleRepository } from '../src/tax/repository.impl.js';
import { createJournalEntryRepository, createRecurringJournalTemplateRepository } from '../src/journal-entry/repository.impl.js';
import { createGeneralLedgerEngine } from '../src/journal-entry/engine.impl.js';
import { createTreasuryTransactionRepository } from '../src/treasury/repository.impl.js';

const ORG = 'org-1';

function setup() {
  const accountRepository = createAccountRepository();
  const journalEntryRepository = createJournalEntryRepository();
  const arInvoiceRepository = createARInvoiceRepository();
  const billRepository = createBillRepository();
  const budgetRepository = createBudgetRepository();
  const taxRuleRepository = createTaxRuleRepository();
  const reportRepository = createFinanceReportRepository();

  const accounts = createChartOfAccountsEngine(accountRepository);
  const generalLedger = createGeneralLedgerEngine(journalEntryRepository, createRecurringJournalTemplateRepository());
  const ar = createAccountsReceivableEngine(createARCustomerRepository(), arInvoiceRepository, createCreditNoteRepository(), createARPaymentRepository());
  const ap = createAccountsPayableEngine(createVendorRepository(), billRepository, createVendorCreditRepository(), createAPPaymentRepository());
  const budgets = createBudgetEngine(budgetRepository, createBudgetRevisionRepository(), journalEntryRepository, accountRepository);
  const tax = createTaxEngine(taxRuleRepository, createTaxCalculationRepository());
  const reports = createFinanceReportEngine(accountRepository, journalEntryRepository, createTreasuryTransactionRepository(), ar, ap, reportRepository);

  const queries = createFinanceQueries({ accountRepository, journalEntryRepository, arInvoiceRepository, billRepository, budgetRepository, taxRuleRepository, reportRepository });

  return { accountRepository, journalEntryRepository, accounts, generalLedger, ar, ap, budgets, tax, reports, queries };
}

describe('FinanceQueries — findAccounts', () => {
  it('filters by accountType and status', async () => {
    const { accounts, queries } = setup();
    const asset = await accounts.create(ORG, { code: '1000', name: 'Cash', accountType: 'asset' });
    await accounts.activate(ORG, asset.id);
    await accounts.create(ORG, { code: '2000', name: 'AP', accountType: 'liability' });

    const assetsOnly = await queries.findAccounts({ organizationId: ORG, accountType: 'asset' });
    expect(assetsOnly.total).toBe(1);

    const activeOnly = await queries.findAccounts({ organizationId: ORG, status: 'active' });
    expect(activeOnly.total).toBe(1);
    expect(activeOnly.accounts[0]?.id).toBe(asset.id);
  });

  it('paginates with offset/limit', async () => {
    const { accounts, queries } = setup();
    for (let i = 0; i < 5; i += 1) await accounts.create(ORG, { code: `${1000 + i}`, name: `A${i}`, accountType: 'asset' });
    const page = await queries.findAccounts({ organizationId: ORG, offset: 2, limit: 2 });
    expect(page.accounts).toHaveLength(2);
    expect(page.total).toBe(5);
  });
});

describe('FinanceQueries — findJournalEntries', () => {
  it('filters by accountId and status', async () => {
    const { generalLedger, queries } = setup();
    const entry = await generalLedger.createJournalEntry(ORG, {
      entryDate: '2026-01-01',
      currency: 'USD',
      lines: [
        { accountId: 'cash', debit: '10.00', credit: '0.00' },
        { accountId: 'revenue', debit: '0.00', credit: '10.00' },
      ],
    });
    await generalLedger.postJournalEntry(ORG, entry.id);

    const byAccount = await queries.findJournalEntries({ organizationId: ORG, accountId: 'cash' });
    expect(byAccount.total).toBe(1);
    const byStatus = await queries.findJournalEntries({ organizationId: ORG, status: 'posted' });
    expect(byStatus.total).toBe(1);
  });
});

describe('FinanceQueries — findInvoices / findBills', () => {
  it('findInvoices() filters by customerId and status', async () => {
    const { ar, queries } = setup();
    const customer = await ar.createCustomer(ORG, { displayName: 'Acme', currency: 'USD' });
    const invoice = await ar.createInvoice(ORG, { customerId: customer.id, currency: 'USD', lines: [{ description: 'x', quantity: '1', unitPrice: '10.00' }] });
    await ar.issueInvoice(ORG, invoice.id, '2026-01-01');
    const result = await queries.findInvoices({ organizationId: ORG, customerId: customer.id, status: 'issued' });
    expect(result.total).toBe(1);
  });

  it('findBills() filters by vendorId and status', async () => {
    const { ap, queries } = setup();
    const vendor = await ap.createVendor(ORG, { displayName: 'Supplier', currency: 'USD' });
    const bill = await ap.createBill(ORG, { vendorId: vendor.id, currency: 'USD', lines: [{ description: 'x', quantity: '1', unitPrice: '10.00' }] });
    await ap.receiveBill(ORG, bill.id, '2026-01-01');
    const result = await queries.findBills({ organizationId: ORG, vendorId: vendor.id, status: 'received' });
    expect(result.total).toBe(1);
  });
});

describe('FinanceQueries — findBudgets / findTaxes / findReports', () => {
  it('findBudgets() filters by scope and fiscalYearId', async () => {
    const { budgets, queries } = setup();
    await budgets.createBudget(ORG, { name: 'A', scope: 'annual', fiscalYearId: 'fy-1', currency: 'USD', lines: [] });
    await budgets.createBudget(ORG, { name: 'B', scope: 'department', fiscalYearId: 'fy-2', currency: 'USD', lines: [] });
    expect((await queries.findBudgets({ organizationId: ORG, scope: 'annual' })).total).toBe(1);
    expect((await queries.findBudgets({ organizationId: ORG, fiscalYearId: 'fy-2' })).total).toBe(1);
  });

  it('findTaxes() filters by taxType', async () => {
    const { tax, queries } = setup();
    await tax.createTaxRule(ORG, { name: 'VAT', taxType: 'VAT', ratePct: '15' });
    await tax.createTaxRule(ORG, { name: 'GST', taxType: 'GST', ratePct: '10' });
    expect((await queries.findTaxes({ organizationId: ORG, taxType: 'VAT' })).total).toBe(1);
  });

  it('findReports() filters by reportType', async () => {
    const { accountRepository, reports, queries } = setup();
    await accountRepository.save({ id: 'a1', organizationId: ORG, createdAt: '', updatedAt: '', code: '1', name: 'A', accountType: 'asset', normalBalance: 'debit', status: 'active', currentVersion: 1 });
    await reports.generateBalanceSheet(ORG, '2026-01-31');
    await reports.generateTrialBalance(ORG, '2026-01-31');
    expect((await queries.findReports({ organizationId: ORG, reportType: 'trial_balance' })).total).toBe(1);
  });
});

describe('FinanceQueries — findBalances', () => {
  it('computes balances across posted journal entries', async () => {
    const { accountRepository, generalLedger, queries } = setup();
    await accountRepository.save({ id: 'cash', organizationId: ORG, createdAt: '', updatedAt: '', code: '1000', name: 'Cash', accountType: 'asset', normalBalance: 'debit', status: 'active', currentVersion: 1 });
    await accountRepository.save({ id: 'revenue', organizationId: ORG, createdAt: '', updatedAt: '', code: '4000', name: 'Revenue', accountType: 'revenue', normalBalance: 'credit', status: 'active', currentVersion: 1 });
    const entry = await generalLedger.createJournalEntry(ORG, {
      entryDate: '2026-01-01',
      currency: 'USD',
      lines: [
        { accountId: 'cash', debit: '500.00', credit: '0.00' },
        { accountId: 'revenue', debit: '0.00', credit: '500.00' },
      ],
    });
    await generalLedger.postJournalEntry(ORG, entry.id);

    const result = await queries.findBalances({ organizationId: ORG });
    expect(result.balances.find((b) => b.accountId === 'cash')?.balance).toBe('500.00');
    expect(result.balances.find((b) => b.accountId === 'revenue')?.balance).toBe('500.00');
  });

  it('filters to a single accountId', async () => {
    const { accountRepository, queries } = setup();
    await accountRepository.save({ id: 'cash', organizationId: ORG, createdAt: '', updatedAt: '', code: '1000', name: 'Cash', accountType: 'asset', normalBalance: 'debit', status: 'active', currentVersion: 1 });
    const result = await queries.findBalances({ organizationId: ORG, accountId: 'cash' });
    expect(result.balances).toHaveLength(1);
  });
});

describe('FinanceQueries — searchFinance', () => {
  it('matches accounts/invoices/bills/budgets by keyword, best score first', async () => {
    const { accounts, ar, ap, budgets, queries } = setup();
    await accounts.create(ORG, { code: '1000', name: 'Petty Cash', accountType: 'asset' });
    const customer = await ar.createCustomer(ORG, { displayName: 'Acme', currency: 'USD' });
    await ar.createInvoice(ORG, { customerId: customer.id, currency: 'USD', invoiceNumber: 'CASH-001', lines: [{ description: 'x', quantity: '1', unitPrice: '1.00' }] });
    const vendor = await ap.createVendor(ORG, { displayName: 'Supplier', currency: 'USD' });
    await ap.createBill(ORG, { vendorId: vendor.id, currency: 'USD', billNumber: 'BILL-CASH', lines: [{ description: 'x', quantity: '1', unitPrice: '1.00' }] });
    await budgets.createBudget(ORG, { name: 'Cash Reserve', scope: 'annual', fiscalYearId: 'fy-1', currency: 'USD', lines: [] });

    const result = await queries.searchFinance({ organizationId: ORG, keyword: 'cash' });
    expect(result.total).toBe(4);
    expect(new Set(result.matches.map((m) => m.recordType))).toEqual(new Set(['account', 'invoice', 'bill', 'budget']));
  });

  it('returns no matches for an unrelated keyword', async () => {
    const { accounts, queries } = setup();
    await accounts.create(ORG, { code: '1000', name: 'Cash', accountType: 'asset' });
    const result = await queries.searchFinance({ organizationId: ORG, keyword: 'zzz-no-match' });
    expect(result.total).toBe(0);
  });
});
