/** @module queries/types */
import type { Account, AccountId, AccountType, NormalBalance } from '../account/types.js';
import type { Bill, BillId, BillStatus, VendorId } from '../accounts-payable/types.js';
import type { ARCustomerId, ARInvoice, ARInvoiceId, ARInvoiceStatus } from '../accounts-receivable/types.js';
import type { Budget, BudgetId, BudgetScope } from '../budget/types.js';
import type { JournalEntry, JournalEntryId, JournalEntryStatus } from '../journal-entry/types.js';
import type { FinanceReport, FinanceReportId, FinanceReportType } from '../report/types.js';
import type { FiscalYearId, OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { TaxRule, TaxRuleId, TaxType } from '../tax/types.js';

export interface FindAccountsQuery extends OrganizationScopedQuery {
  readonly accountType?: AccountType;
  readonly status?: Account['status'];
}

export interface FindAccountsResult {
  readonly accounts: readonly Account[];
  readonly total: number;
}

export interface FindJournalEntriesQuery extends OrganizationScopedQuery {
  readonly accountId?: AccountId;
  readonly status?: JournalEntryStatus;
}

export interface FindJournalEntriesResult {
  readonly entries: readonly JournalEntry[];
  readonly total: number;
}

export interface FindInvoicesQuery extends OrganizationScopedQuery {
  readonly customerId?: ARCustomerId;
  readonly status?: ARInvoiceStatus;
}

export interface FindInvoicesResult {
  readonly invoices: readonly ARInvoice[];
  readonly total: number;
}

export interface FindBillsQuery extends OrganizationScopedQuery {
  readonly vendorId?: VendorId;
  readonly status?: BillStatus;
}

export interface FindBillsResult {
  readonly bills: readonly Bill[];
  readonly total: number;
}

export interface FindBudgetsQuery extends OrganizationScopedQuery {
  readonly scope?: BudgetScope;
  readonly fiscalYearId?: FiscalYearId;
}

export interface FindBudgetsResult {
  readonly budgets: readonly Budget[];
  readonly total: number;
}

export interface FindTaxesQuery extends OrganizationScopedQuery {
  readonly taxType?: TaxType;
}

export interface FindTaxesResult {
  readonly rules: readonly TaxRule[];
  readonly total: number;
}

export interface FindReportsQuery extends OrganizationScopedQuery {
  readonly reportType?: FinanceReportType;
}

export interface FindReportsResult {
  readonly reports: readonly FinanceReport[];
  readonly total: number;
}

export interface FindBalancesQuery {
  readonly organizationId: OrganizationId;
  readonly accountId?: AccountId;
}

export interface AccountBalance {
  readonly accountId: AccountId;
  readonly code: string;
  readonly name: string;
  readonly accountType: AccountType;
  readonly normalBalance: NormalBalance;
  readonly balance: string;
}

export interface FindBalancesResult {
  readonly balances: readonly AccountBalance[];
}

export interface SearchFinanceQuery extends OrganizationScopedQuery {
  readonly keyword: string;
}

export type SearchFinanceRecordType = 'account' | 'invoice' | 'bill' | 'budget';

export interface SearchFinanceMatch {
  readonly recordType: SearchFinanceRecordType;
  readonly id: AccountId | ARInvoiceId | BillId | BudgetId | JournalEntryId | FinanceReportId | TaxRuleId;
  readonly label: string;
  readonly score: number;
}

export interface SearchFinanceResult {
  readonly matches: readonly SearchFinanceMatch[];
  readonly total: number;
}
