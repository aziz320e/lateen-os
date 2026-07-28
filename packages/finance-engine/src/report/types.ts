/** @module report/types */
import type { AccountId, AccountType } from '../account/types.js';
import type { AgingReport as ARAgingReport } from '../accounts-receivable/types.js';
import type { AgingReport as APAgingReport } from '../accounts-payable/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { FinanceReportId, JournalEntryId } from '../shared/identifiers.js';
import type { ISODate, ISODateTime } from '../shared/primitives.js';

export type { FinanceReportId };
export type { ARAgingReport, APAgingReport };

export type FinanceReportType = 'balance_sheet' | 'income_statement' | 'trial_balance' | 'cash_flow' | 'general_ledger' | 'ar_aging' | 'ap_aging';

export interface AccountBalanceLine {
  readonly accountId: AccountId;
  readonly code: string;
  readonly name: string;
  readonly balance: string;
}

export interface BalanceSheetData {
  readonly asOf: ISODate;
  readonly assets: readonly AccountBalanceLine[];
  readonly liabilities: readonly AccountBalanceLine[];
  readonly equity: readonly AccountBalanceLine[];
  readonly totalAssets: string;
  readonly totalLiabilities: string;
  readonly totalEquity: string;
}

export interface IncomeStatementData {
  readonly periodStart: ISODate;
  readonly periodEnd: ISODate;
  readonly revenue: readonly AccountBalanceLine[];
  readonly expenses: readonly AccountBalanceLine[];
  readonly totalRevenue: string;
  readonly totalExpenses: string;
  readonly netIncome: string;
}

export interface TrialBalanceLine {
  readonly accountId: AccountId;
  readonly code: string;
  readonly name: string;
  readonly accountType: AccountType;
  readonly debit: string;
  readonly credit: string;
}

export interface TrialBalanceData {
  readonly asOf: ISODate;
  readonly lines: readonly TrialBalanceLine[];
  readonly totalDebit: string;
  readonly totalCredit: string;
}

export interface CashFlowData {
  readonly periodStart: ISODate;
  readonly periodEnd: ISODate;
  readonly totalInflow: string;
  readonly totalOutflow: string;
  readonly netChange: string;
}

export interface GeneralLedgerLine {
  readonly journalEntryId: JournalEntryId;
  readonly entryDate: ISODate;
  readonly accountId: AccountId;
  readonly description?: string;
  readonly debit: string;
  readonly credit: string;
  readonly runningBalance: string;
}

export interface GeneralLedgerReportData {
  readonly accountId?: AccountId;
  readonly periodStart?: ISODate;
  readonly periodEnd?: ISODate;
  readonly lines: readonly GeneralLedgerLine[];
}

export type FinanceReportData =
  | BalanceSheetData
  | IncomeStatementData
  | TrialBalanceData
  | CashFlowData
  | GeneralLedgerReportData
  | ARAgingReport
  | APAgingReport;

/** A generated, persisted Financial Report. `data`'s shape is determined by `reportType`. */
export interface FinanceReport extends TenantAuditableEntity<FinanceReportId> {
  readonly reportType: FinanceReportType;
  readonly asOf?: ISODate;
  readonly periodStart?: ISODate;
  readonly periodEnd?: ISODate;
  readonly data: FinanceReportData;
  readonly generatedAt: ISODateTime;
}
