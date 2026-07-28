/**
 * Real Financial Reports engine — Balance Sheet, Income Statement,
 * Trial Balance, Cash Flow, General Ledger Report, AR Aging, and AP
 * Aging. Every report is computed fresh from posted General Ledger
 * journal entries (and, for the two aging reports, from this
 * package's own Accounts Receivable/Payable engines) — intra-package
 * composition, not a second implementation of any accounting logic.
 *
 * @module report/engine.impl
 */
import type { AccountRepository } from '../account/repository.js';
import type { Account, AccountId } from '../account/types.js';
import type { AgingReport as APAgingReport } from '../accounts-payable/types.js';
import type { AgingReport as ARAgingReport } from '../accounts-receivable/types.js';
import type { FinanceEventBus } from '../events/finance-event-bus.js';
import { computeAccountNetAmount } from '../journal-entry/engine.impl.js';
import type { JournalEntryRepository } from '../journal-entry/repository.js';
import type { JournalEntry } from '../journal-entry/types.js';
import { addAmounts, compareAmounts, negateAmount, subtractAmounts, sumAmounts } from '../shared/decimal.js';
import { generateId, nowIso } from '../shared/id.js';
import type { FinanceReportId, OrganizationId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { TreasuryTransactionRepository } from '../treasury/repository.js';
import type { FinanceReportRepository } from './repository.js';
import type {
  AccountBalanceLine,
  BalanceSheetData,
  CashFlowData,
  FinanceReport,
  FinanceReportType,
  GeneralLedgerLine,
  GeneralLedgerReportData,
  IncomeStatementData,
  TrialBalanceData,
  TrialBalanceLine,
} from './types.js';

export interface AccountsReceivableAgingSource {
  computeAging(organizationId: OrganizationId, asOf: ISODate): Promise<ARAgingReport>;
}

export interface AccountsPayableAgingSource {
  computeAging(organizationId: OrganizationId, asOf: ISODate): Promise<APAgingReport>;
}

function toBalanceLine(account: Account, balance: string): AccountBalanceLine {
  return { accountId: account.id, code: account.code, name: account.name, balance };
}

export interface FinanceReportEngine {
  generateBalanceSheet(organizationId: OrganizationId, asOf: ISODate): Promise<FinanceReport>;
  generateIncomeStatement(organizationId: OrganizationId, periodStart: ISODate, periodEnd: ISODate): Promise<FinanceReport>;
  generateTrialBalance(organizationId: OrganizationId, asOf: ISODate): Promise<FinanceReport>;
  generateCashFlow(organizationId: OrganizationId, periodStart: ISODate, periodEnd: ISODate): Promise<FinanceReport>;
  generateGeneralLedgerReport(organizationId: OrganizationId, options?: { accountId?: AccountId; periodStart?: ISODate; periodEnd?: ISODate }): Promise<FinanceReport>;
  generateARAgingReport(organizationId: OrganizationId, asOf: ISODate): Promise<FinanceReport>;
  generateAPAgingReport(organizationId: OrganizationId, asOf: ISODate): Promise<FinanceReport>;
  getReport(organizationId: OrganizationId, reportId: FinanceReportId): Promise<FinanceReport | null>;
  listReports(organizationId: OrganizationId): Promise<readonly FinanceReport[]>;
  findByType(organizationId: OrganizationId, reportType: FinanceReportType): Promise<readonly FinanceReport[]>;
}

/** Creates a real {@link FinanceReportEngine}. */
export function createFinanceReportEngine(
  accountRepository: AccountRepository,
  journalEntryRepository: JournalEntryRepository,
  treasuryTransactionRepository: TreasuryTransactionRepository,
  arAging: AccountsReceivableAgingSource,
  apAging: AccountsPayableAgingSource,
  reportRepository: FinanceReportRepository,
  eventBus?: FinanceEventBus,
  now: () => string = nowIso,
): FinanceReportEngine {
  async function persist(
    organizationId: OrganizationId,
    reportType: FinanceReportType,
    data: FinanceReport['data'],
    extra: { asOf?: ISODate; periodStart?: ISODate; periodEnd?: ISODate },
  ): Promise<FinanceReport> {
    const timestamp = now();
    const report: FinanceReport = {
      id: generateId('finance-report'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      reportType,
      asOf: extra.asOf,
      periodStart: extra.periodStart,
      periodEnd: extra.periodEnd,
      data,
      generatedAt: timestamp,
    };
    await reportRepository.save(report);
    eventBus?.publish('report.generated', { organizationId, reportId: report.id, reportType });
    return report;
  }

  async function postedEntriesAsOf(organizationId: OrganizationId, asOf: ISODate): Promise<readonly JournalEntry[]> {
    return (await journalEntryRepository.findAll(organizationId)).filter((entry) => entry.status === 'posted' && entry.entryDate <= asOf);
  }

  async function postedEntriesInRange(organizationId: OrganizationId, periodStart: ISODate, periodEnd: ISODate): Promise<readonly JournalEntry[]> {
    return (await journalEntryRepository.findAll(organizationId)).filter(
      (entry) => entry.status === 'posted' && entry.entryDate >= periodStart && entry.entryDate <= periodEnd,
    );
  }

  return {
    async generateBalanceSheet(organizationId, asOf) {
      const entries = await postedEntriesAsOf(organizationId, asOf);
      const accounts = await accountRepository.findAll(organizationId);

      const assets: AccountBalanceLine[] = [];
      const liabilities: AccountBalanceLine[] = [];
      const equity: AccountBalanceLine[] = [];

      for (const account of accounts) {
        const balance = computeAccountNetAmount(entries, account.id, account.normalBalance);
        if (account.accountType === 'asset') assets.push(toBalanceLine(account, balance));
        else if (account.accountType === 'liability') liabilities.push(toBalanceLine(account, balance));
        else if (account.accountType === 'equity') equity.push(toBalanceLine(account, balance));
      }

      const data: BalanceSheetData = {
        asOf,
        assets,
        liabilities,
        equity,
        totalAssets: sumAmounts(assets.map((line) => line.balance)),
        totalLiabilities: sumAmounts(liabilities.map((line) => line.balance)),
        totalEquity: sumAmounts(equity.map((line) => line.balance)),
      };
      return persist(organizationId, 'balance_sheet', data, { asOf });
    },

    async generateIncomeStatement(organizationId, periodStart, periodEnd) {
      const entries = await postedEntriesInRange(organizationId, periodStart, periodEnd);
      const accounts = await accountRepository.findAll(organizationId);

      const revenue: AccountBalanceLine[] = [];
      const expenses: AccountBalanceLine[] = [];

      for (const account of accounts) {
        const balance = computeAccountNetAmount(entries, account.id, account.normalBalance);
        if (account.accountType === 'revenue') revenue.push(toBalanceLine(account, balance));
        else if (account.accountType === 'expense') expenses.push(toBalanceLine(account, balance));
      }

      const totalRevenue = sumAmounts(revenue.map((line) => line.balance));
      const totalExpenses = sumAmounts(expenses.map((line) => line.balance));
      const data: IncomeStatementData = {
        periodStart,
        periodEnd,
        revenue,
        expenses,
        totalRevenue,
        totalExpenses,
        netIncome: subtractAmounts(totalRevenue, totalExpenses),
      };
      return persist(organizationId, 'income_statement', data, { periodStart, periodEnd });
    },

    async generateTrialBalance(organizationId, asOf) {
      const entries = await postedEntriesAsOf(organizationId, asOf);
      const accounts = await accountRepository.findAll(organizationId);

      const lines: TrialBalanceLine[] = accounts.map((account) => {
        const net = computeAccountNetAmount(entries, account.id, account.normalBalance);
        const isPositive = compareAmounts(net, '0') >= 0;
        const debit = account.normalBalance === 'debit' ? (isPositive ? net : '0.00') : isPositive ? '0.00' : negateAmount(net);
        const credit = account.normalBalance === 'credit' ? (isPositive ? net : '0.00') : isPositive ? '0.00' : negateAmount(net);
        return { accountId: account.id, code: account.code, name: account.name, accountType: account.accountType, debit, credit };
      });

      const data: TrialBalanceData = {
        asOf,
        lines,
        totalDebit: sumAmounts(lines.map((line) => line.debit)),
        totalCredit: sumAmounts(lines.map((line) => line.credit)),
      };
      return persist(organizationId, 'trial_balance', data, { asOf });
    },

    async generateCashFlow(organizationId, periodStart, periodEnd) {
      const transactions = (await treasuryTransactionRepository.findAll(organizationId)).filter(
        (tx) => tx.occurredAt >= periodStart && tx.occurredAt <= periodEnd,
      );
      const totalInflow = sumAmounts(transactions.filter((tx) => tx.transactionType === 'deposit').map((tx) => tx.amount));
      const totalOutflow = sumAmounts(transactions.filter((tx) => tx.transactionType === 'withdrawal').map((tx) => tx.amount));
      const data: CashFlowData = { periodStart, periodEnd, totalInflow, totalOutflow, netChange: subtractAmounts(totalInflow, totalOutflow) };
      return persist(organizationId, 'cash_flow', data, { periodStart, periodEnd });
    },

    async generateGeneralLedgerReport(organizationId, options = {}) {
      let entries = (await journalEntryRepository.findAll(organizationId)).filter((entry) => entry.status === 'posted');
      if (options.periodStart) entries = entries.filter((entry) => entry.entryDate >= options.periodStart!);
      if (options.periodEnd) entries = entries.filter((entry) => entry.entryDate <= options.periodEnd!);
      entries = [...entries].sort((a, b) => (a.entryDate < b.entryDate ? -1 : a.entryDate > b.entryDate ? 1 : 0));

      const accounts = await accountRepository.findAll(organizationId);
      const normalBalanceByAccount = new Map(accounts.map((account) => [account.id, account.normalBalance] as const));
      const runningByAccount = new Map<string, string>();
      const lines: GeneralLedgerLine[] = [];

      for (const entry of entries) {
        for (const line of entry.lines) {
          if (options.accountId && line.accountId !== options.accountId) continue;
          const normalBalance = normalBalanceByAccount.get(line.accountId) ?? 'debit';
          const delta = normalBalance === 'debit' ? subtractAmounts(line.debit, line.credit) : subtractAmounts(line.credit, line.debit);
          const running = addAmounts(runningByAccount.get(line.accountId) ?? '0.00', delta);
          runningByAccount.set(line.accountId, running);
          lines.push({
            journalEntryId: entry.id,
            entryDate: entry.entryDate,
            accountId: line.accountId,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
            runningBalance: running,
          });
        }
      }

      const data: GeneralLedgerReportData = { accountId: options.accountId, periodStart: options.periodStart, periodEnd: options.periodEnd, lines };
      return persist(organizationId, 'general_ledger', data, { periodStart: options.periodStart, periodEnd: options.periodEnd });
    },

    async generateARAgingReport(organizationId, asOf) {
      const data = await arAging.computeAging(organizationId, asOf);
      return persist(organizationId, 'ar_aging', data, { asOf });
    },

    async generateAPAgingReport(organizationId, asOf) {
      const data = await apAging.computeAging(organizationId, asOf);
      return persist(organizationId, 'ap_aging', data, { asOf });
    },

    async getReport(organizationId, reportId) {
      return reportRepository.findById(organizationId, reportId);
    },

    async listReports(organizationId) {
      return reportRepository.findAll(organizationId);
    },

    async findByType(organizationId, reportType) {
      return reportRepository.findByType(organizationId, reportType);
    },
  };
}
