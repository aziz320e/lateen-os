/** @module queries/finance-queries */
import type {
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
  SearchFinanceQuery,
  SearchFinanceResult,
} from './types.js';

/** Real, read-only Finance Engine query port. */
export interface FinanceQueries {
  findAccounts(query: FindAccountsQuery): Promise<FindAccountsResult>;
  findJournalEntries(query: FindJournalEntriesQuery): Promise<FindJournalEntriesResult>;
  findInvoices(query: FindInvoicesQuery): Promise<FindInvoicesResult>;
  findBills(query: FindBillsQuery): Promise<FindBillsResult>;
  findBudgets(query: FindBudgetsQuery): Promise<FindBudgetsResult>;
  findTaxes(query: FindTaxesQuery): Promise<FindTaxesResult>;
  findReports(query: FindReportsQuery): Promise<FindReportsResult>;
  findBalances(query: FindBalancesQuery): Promise<FindBalancesResult>;
  searchFinance(query: SearchFinanceQuery): Promise<SearchFinanceResult>;
}
