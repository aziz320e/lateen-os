import { describe, expect, it } from 'vitest';
import { createAccountRepository } from '../src/account/repository.impl.js';
import type { Account } from '../src/account/types.js';
import { createAccountsPayableEngine } from '../src/accounts-payable/engine.impl.js';
import { createAPPaymentRepository, createBillRepository, createVendorCreditRepository, createVendorRepository } from '../src/accounts-payable/repository.impl.js';
import { createAccountsReceivableEngine } from '../src/accounts-receivable/engine.impl.js';
import { createARCustomerRepository, createARInvoiceRepository, createARPaymentRepository, createCreditNoteRepository } from '../src/accounts-receivable/repository.impl.js';
import { createFinanceEventBus } from '../src/events/index.js';
import { createGeneralLedgerEngine } from '../src/journal-entry/engine.impl.js';
import { createJournalEntryRepository, createRecurringJournalTemplateRepository } from '../src/journal-entry/repository.impl.js';
import { createFinanceReportEngine } from '../src/report/engine.impl.js';
import { createFinanceReportRepository } from '../src/report/repository.impl.js';
import { createTreasuryTransactionRepository } from '../src/treasury/repository.impl.js';
import type { BalanceSheetData, CashFlowData, GeneralLedgerReportData, IncomeStatementData, TrialBalanceData } from '../src/report/types.js';
import type { AgingReport } from '../src/accounts-receivable/types.js';

const ORG = 'org-1';

const CASH = 'account-cash';
const AR = 'account-ar';
const REVENUE = 'account-revenue';
const EXPENSE = 'account-expense';
const AP = 'account-ap';

async function seedAccounts(accountRepository: ReturnType<typeof createAccountRepository>) {
  const accounts: readonly Account[] = [
    { id: CASH, organizationId: ORG, createdAt: '', updatedAt: '', code: '1000', name: 'Cash', accountType: 'asset', normalBalance: 'debit', status: 'active', currentVersion: 1 },
    { id: AR, organizationId: ORG, createdAt: '', updatedAt: '', code: '1100', name: 'Accounts Receivable', accountType: 'asset', normalBalance: 'debit', status: 'active', currentVersion: 1 },
    { id: AP, organizationId: ORG, createdAt: '', updatedAt: '', code: '2000', name: 'Accounts Payable', accountType: 'liability', normalBalance: 'credit', status: 'active', currentVersion: 1 },
    { id: REVENUE, organizationId: ORG, createdAt: '', updatedAt: '', code: '4000', name: 'Sales Revenue', accountType: 'revenue', normalBalance: 'credit', status: 'active', currentVersion: 1 },
    { id: EXPENSE, organizationId: ORG, createdAt: '', updatedAt: '', code: '5000', name: 'Cost of Goods', accountType: 'expense', normalBalance: 'debit', status: 'active', currentVersion: 1 },
  ];
  for (const account of accounts) await accountRepository.save(account);
}

function setup() {
  const accountRepository = createAccountRepository();
  const journalEntryRepository = createJournalEntryRepository();
  const recurringTemplateRepository = createRecurringJournalTemplateRepository();
  const treasuryTransactionRepository = createTreasuryTransactionRepository();
  const reportRepository = createFinanceReportRepository();
  const eventBus = createFinanceEventBus();

  const generalLedger = createGeneralLedgerEngine(journalEntryRepository, recurringTemplateRepository, eventBus);

  const arEngine = createAccountsReceivableEngine(
    createARCustomerRepository(),
    createARInvoiceRepository(),
    createCreditNoteRepository(),
    createARPaymentRepository(),
    eventBus,
  );
  const apEngine = createAccountsPayableEngine(
    createVendorRepository(),
    createBillRepository(),
    createVendorCreditRepository(),
    createAPPaymentRepository(),
    eventBus,
  );

  const reports = createFinanceReportEngine(accountRepository, journalEntryRepository, treasuryTransactionRepository, arEngine, apEngine, reportRepository, eventBus);

  return { accountRepository, journalEntryRepository, treasuryTransactionRepository, generalLedger, arEngine, apEngine, reports, reportRepository, eventBus };
}

async function postSaleEntry(generalLedger: ReturnType<typeof setup>['generalLedger'], entryDate: string) {
  const entry = await generalLedger.createJournalEntry(ORG, {
    entryDate,
    currency: 'USD',
    lines: [
      { accountId: AR, debit: '1000.00', credit: '0.00' },
      { accountId: REVENUE, debit: '0.00', credit: '1000.00' },
    ],
  });
  await generalLedger.postJournalEntry(ORG, entry.id);
}

async function postExpenseEntry(generalLedger: ReturnType<typeof setup>['generalLedger'], entryDate: string) {
  const entry = await generalLedger.createJournalEntry(ORG, {
    entryDate,
    currency: 'USD',
    lines: [
      { accountId: EXPENSE, debit: '400.00', credit: '0.00' },
      { accountId: AP, debit: '0.00', credit: '400.00' },
    ],
  });
  await generalLedger.postJournalEntry(ORG, entry.id);
}

describe('FinanceReportEngine — generateBalanceSheet', () => {
  it('groups account balances by assets/liabilities/equity', async () => {
    const { accountRepository, generalLedger, reports } = setup();
    await seedAccounts(accountRepository);
    await postSaleEntry(generalLedger, '2026-01-15');
    await postExpenseEntry(generalLedger, '2026-01-20');

    const report = await reports.generateBalanceSheet(ORG, '2026-01-31');
    const data = report.data as BalanceSheetData;
    expect(report.reportType).toBe('balance_sheet');
    expect(data.assets.find((a) => a.accountId === AR)?.balance).toBe('1000.00');
    expect(data.liabilities.find((a) => a.accountId === AP)?.balance).toBe('400.00');
    expect(data.totalAssets).toBe('1000.00');
    expect(data.totalLiabilities).toBe('400.00');
  });

  it('excludes entries dated after asOf', async () => {
    const { accountRepository, generalLedger, reports } = setup();
    await seedAccounts(accountRepository);
    await postSaleEntry(generalLedger, '2026-02-15');
    const report = await reports.generateBalanceSheet(ORG, '2026-01-31');
    const data = report.data as BalanceSheetData;
    expect(data.totalAssets).toBe('0.00');
  });
});

describe('FinanceReportEngine — generateIncomeStatement', () => {
  it('computes revenue, expenses, and net income within the period', async () => {
    const { accountRepository, generalLedger, reports } = setup();
    await seedAccounts(accountRepository);
    await postSaleEntry(generalLedger, '2026-01-15');
    await postExpenseEntry(generalLedger, '2026-01-20');

    const report = await reports.generateIncomeStatement(ORG, '2026-01-01', '2026-01-31');
    const data = report.data as IncomeStatementData;
    expect(data.totalRevenue).toBe('1000.00');
    expect(data.totalExpenses).toBe('400.00');
    expect(data.netIncome).toBe('600.00');
  });
});

describe('FinanceReportEngine — generateTrialBalance', () => {
  it('balances total debit and total credit', async () => {
    const { accountRepository, generalLedger, reports } = setup();
    await seedAccounts(accountRepository);
    await postSaleEntry(generalLedger, '2026-01-15');
    await postExpenseEntry(generalLedger, '2026-01-20');

    const report = await reports.generateTrialBalance(ORG, '2026-01-31');
    const data = report.data as TrialBalanceData;
    expect(data.totalDebit).toBe(data.totalCredit);
    expect(data.totalDebit).toBe('1400.00');
  });
});

describe('FinanceReportEngine — generateCashFlow', () => {
  it('nets deposits and withdrawals within the period', async () => {
    const { treasuryTransactionRepository, reports } = setup();
    await treasuryTransactionRepository.save({
      id: 'tx-1',
      organizationId: ORG,
      createdAt: '',
      updatedAt: '',
      transactionType: 'deposit',
      amount: '500.00',
      currency: 'USD',
      toCashAccountId: CASH,
      occurredAt: '2026-01-10',
      reconciled: false,
    });
    await treasuryTransactionRepository.save({
      id: 'tx-2',
      organizationId: ORG,
      createdAt: '',
      updatedAt: '',
      transactionType: 'withdrawal',
      amount: '200.00',
      currency: 'USD',
      fromCashAccountId: CASH,
      occurredAt: '2026-01-15',
      reconciled: false,
    });

    const report = await reports.generateCashFlow(ORG, '2026-01-01', '2026-01-31');
    const data = report.data as CashFlowData;
    expect(data.totalInflow).toBe('500.00');
    expect(data.totalOutflow).toBe('200.00');
    expect(data.netChange).toBe('300.00');
  });
});

describe('FinanceReportEngine — generateGeneralLedgerReport', () => {
  it('produces per-account running balances sorted by date', async () => {
    const { accountRepository, generalLedger, reports } = setup();
    await seedAccounts(accountRepository);
    await postSaleEntry(generalLedger, '2026-01-10');
    await postSaleEntry(generalLedger, '2026-01-20');

    const report = await reports.generateGeneralLedgerReport(ORG, { accountId: AR });
    const data = report.data as GeneralLedgerReportData;
    expect(data.lines).toHaveLength(2);
    expect(data.lines[0]?.runningBalance).toBe('1000.00');
    expect(data.lines[1]?.runningBalance).toBe('2000.00');
  });
});

describe('FinanceReportEngine — AR/AP aging reports', () => {
  it('generateARAgingReport() delegates to the AR engine and persists the result', async () => {
    const { arEngine, reports } = setup();
    const customer = await arEngine.createCustomer(ORG, { displayName: 'Acme', currency: 'USD', paymentTermsDays: 10 });
    const invoice = await arEngine.createInvoice(ORG, { customerId: customer.id, currency: 'USD', lines: [{ description: 'x', quantity: '1', unitPrice: '100.00' }] });
    await arEngine.issueInvoice(ORG, invoice.id, '2026-01-01');

    const report = await reports.generateARAgingReport(ORG, '2026-02-15');
    expect(report.reportType).toBe('ar_aging');
    const data = report.data as AgingReport;
    expect(data.total).toBe('100.00');
  });

  it('generateAPAgingReport() delegates to the AP engine', async () => {
    const { apEngine, reports } = setup();
    const vendor = await apEngine.createVendor(ORG, { displayName: 'Supplier', currency: 'USD', paymentTermsDays: 10 });
    const bill = await apEngine.createBill(ORG, { vendorId: vendor.id, currency: 'USD', lines: [{ description: 'x', quantity: '1', unitPrice: '50.00' }] });
    await apEngine.receiveBill(ORG, bill.id, '2026-01-01');

    const report = await reports.generateAPAgingReport(ORG, '2026-01-05');
    expect(report.reportType).toBe('ap_aging');
  });
});

describe('FinanceReportEngine — generateGeneralLedgerReport without an accountId filter', () => {
  it('lists lines across every account, each with its own running balance', async () => {
    const { accountRepository, generalLedger, reports } = setup();
    await seedAccounts(accountRepository);
    await postSaleEntry(generalLedger, '2026-01-10');
    await postExpenseEntry(generalLedger, '2026-01-12');

    const report = await reports.generateGeneralLedgerReport(ORG);
    const data = report.data as GeneralLedgerReportData;
    expect(data.lines).toHaveLength(4);
  });

  it('filters by periodStart/periodEnd', async () => {
    const { accountRepository, generalLedger, reports } = setup();
    await seedAccounts(accountRepository);
    await postSaleEntry(generalLedger, '2025-06-01');
    await postSaleEntry(generalLedger, '2026-01-10');

    const report = await reports.generateGeneralLedgerReport(ORG, { accountId: AR, periodStart: '2026-01-01', periodEnd: '2026-12-31' });
    const data = report.data as GeneralLedgerReportData;
    expect(data.lines).toHaveLength(1);
  });
});

describe('FinanceReportEngine — persistence, events, and queries', () => {
  it('persists every generated report and publishes report.generated', async () => {
    const { accountRepository, reports, eventBus } = setup();
    await seedAccounts(accountRepository);
    let seen: unknown;
    eventBus.subscribe('report.generated', (payload) => (seen = payload));
    const report = await reports.generateBalanceSheet(ORG, '2026-01-31');
    expect(await reports.getReport(ORG, report.id)).toEqual(report);
    expect(seen).toEqual({ organizationId: ORG, reportId: report.id, reportType: 'balance_sheet' });
  });

  it('listReports()/findByType() work as expected', async () => {
    const { accountRepository, reports } = setup();
    await seedAccounts(accountRepository);
    await reports.generateBalanceSheet(ORG, '2026-01-31');
    await reports.generateTrialBalance(ORG, '2026-01-31');
    expect(await reports.listReports(ORG)).toHaveLength(2);
    expect(await reports.findByType(ORG, 'balance_sheet')).toHaveLength(1);
  });
});
