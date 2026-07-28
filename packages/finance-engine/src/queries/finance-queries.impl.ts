/**
 * Real {@link FinanceQueries} implementation — a CQRS read layer
 * composed over the Finance Engine repositories. Repositories are
 * taken as constructor dependencies but never returned to callers.
 *
 * @module queries/finance-queries.impl
 */
import type { AccountRepository } from '../account/repository.js';
import type { BillRepository } from '../accounts-payable/repository.js';
import type { ARCustomerRepository, ARInvoiceRepository } from '../accounts-receivable/repository.js';
import type { BudgetRepository } from '../budget/repository.js';
import { computeAccountNetAmount } from '../journal-entry/engine.impl.js';
import type { JournalEntryRepository } from '../journal-entry/repository.js';
import type { FinanceReportRepository } from '../report/repository.js';
import type { TaxRuleRepository } from '../tax/repository.js';
import type { FinanceQueries } from './finance-queries.js';
import type {
  AccountBalance,
  FindAccountsQuery,
  FindAccountsResult,
  FindBalancesQuery,
  FindBalancesResult,
  FindBillsQuery,
  FindBillsResult,
  FindBudgetsQuery,
  FindBudgetsResult,
  FindInvoicesQuery,
  FindInvoicesResult,
  FindJournalEntriesQuery,
  FindJournalEntriesResult,
  FindReportsQuery,
  FindReportsResult,
  FindTaxesQuery,
  FindTaxesResult,
  SearchFinanceMatch,
  SearchFinanceQuery,
  SearchFinanceResult,
} from './types.js';

export interface FinanceQueriesDeps {
  readonly accountRepository: AccountRepository;
  readonly journalEntryRepository: JournalEntryRepository;
  readonly arInvoiceRepository: ARInvoiceRepository;
  readonly billRepository: BillRepository;
  readonly budgetRepository: BudgetRepository;
  readonly taxRuleRepository: TaxRuleRepository;
  readonly reportRepository: FinanceReportRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}

/** Creates a real {@link FinanceQueries} read port over the given repositories. */
export function createFinanceQueries(deps: FinanceQueriesDeps): FinanceQueries {
  return {
    async findAccounts(query: FindAccountsQuery): Promise<FindAccountsResult> {
      let accounts = query.accountType
        ? await deps.accountRepository.findByType(query.organizationId, query.accountType)
        : await deps.accountRepository.findAll(query.organizationId);
      if (query.status) accounts = accounts.filter((account) => account.status === query.status);
      return { accounts: paginate(accounts, query.offset, query.limit), total: accounts.length };
    },

    async findJournalEntries(query: FindJournalEntriesQuery): Promise<FindJournalEntriesResult> {
      let entries = query.accountId
        ? await deps.journalEntryRepository.findByAccount(query.organizationId, query.accountId)
        : await deps.journalEntryRepository.findAll(query.organizationId);
      if (query.status) entries = entries.filter((entry) => entry.status === query.status);
      return { entries: paginate(entries, query.offset, query.limit), total: entries.length };
    },

    async findInvoices(query: FindInvoicesQuery): Promise<FindInvoicesResult> {
      let invoices = query.customerId
        ? await deps.arInvoiceRepository.findByCustomer(query.organizationId, query.customerId)
        : await deps.arInvoiceRepository.findAll(query.organizationId);
      if (query.status) invoices = invoices.filter((invoice) => invoice.status === query.status);
      return { invoices: paginate(invoices, query.offset, query.limit), total: invoices.length };
    },

    async findBills(query: FindBillsQuery): Promise<FindBillsResult> {
      let bills = query.vendorId
        ? await deps.billRepository.findByVendor(query.organizationId, query.vendorId)
        : await deps.billRepository.findAll(query.organizationId);
      if (query.status) bills = bills.filter((bill) => bill.status === query.status);
      return { bills: paginate(bills, query.offset, query.limit), total: bills.length };
    },

    async findBudgets(query: FindBudgetsQuery): Promise<FindBudgetsResult> {
      let budgets = query.fiscalYearId
        ? await deps.budgetRepository.findByFiscalYear(query.organizationId, query.fiscalYearId)
        : await deps.budgetRepository.findAll(query.organizationId);
      if (query.scope) budgets = budgets.filter((budget) => budget.scope === query.scope);
      return { budgets: paginate(budgets, query.offset, query.limit), total: budgets.length };
    },

    async findTaxes(query: FindTaxesQuery): Promise<FindTaxesResult> {
      const rules = query.taxType
        ? await deps.taxRuleRepository.findByType(query.organizationId, query.taxType)
        : await deps.taxRuleRepository.findAll(query.organizationId);
      return { rules: paginate(rules, query.offset, query.limit), total: rules.length };
    },

    async findReports(query: FindReportsQuery): Promise<FindReportsResult> {
      const reports = query.reportType
        ? await deps.reportRepository.findByType(query.organizationId, query.reportType)
        : await deps.reportRepository.findAll(query.organizationId);
      return { reports: paginate(reports, query.offset, query.limit), total: reports.length };
    },

    async findBalances(query: FindBalancesQuery): Promise<FindBalancesResult> {
      const accounts = query.accountId
        ? [await deps.accountRepository.findById(query.organizationId, query.accountId)].filter((a): a is NonNullable<typeof a> => a !== null)
        : await deps.accountRepository.findAll(query.organizationId);
      const postedEntries = (await deps.journalEntryRepository.findAll(query.organizationId)).filter((entry) => entry.status === 'posted');

      const balances: AccountBalance[] = accounts.map((account) => ({
        accountId: account.id,
        code: account.code,
        name: account.name,
        accountType: account.accountType,
        normalBalance: account.normalBalance,
        balance: computeAccountNetAmount(postedEntries, account.id, account.normalBalance),
      }));

      return { balances };
    },

    async searchFinance(query: SearchFinanceQuery): Promise<SearchFinanceResult> {
      const [accounts, invoices, bills, budgets] = await Promise.all([
        deps.accountRepository.findAll(query.organizationId),
        deps.arInvoiceRepository.findAll(query.organizationId),
        deps.billRepository.findAll(query.organizationId),
        deps.budgetRepository.findAll(query.organizationId),
      ]);

      const matches: SearchFinanceMatch[] = [];
      for (const account of accounts) {
        const score = scoreLabel(account.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'account', id: account.id, label: account.name, score });
      }
      for (const invoice of invoices) {
        const label = invoice.invoiceNumber ?? invoice.id;
        const score = scoreLabel(label, query.keyword);
        if (score > 0) matches.push({ recordType: 'invoice', id: invoice.id, label, score });
      }
      for (const bill of bills) {
        const label = bill.billNumber ?? bill.id;
        const score = scoreLabel(label, query.keyword);
        if (score > 0) matches.push({ recordType: 'bill', id: bill.id, label, score });
      }
      for (const budget of budgets) {
        const score = scoreLabel(budget.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'budget', id: budget.id, label: budget.name, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      const limited = query.limit === undefined ? matches : matches.slice(0, query.limit);
      return { matches: limited, total: matches.length };
    },
  };
}
