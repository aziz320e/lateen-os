/**
 * @lateen-os/finance-engine — Finance Engine
 *
 * Financial organization (fiscal years/periods, accounting settings,
 * exchange rates, numbering sequences), the Chart of Accounts, the
 * General Ledger, Accounts Receivable, Accounts Payable, Treasury,
 * Budgeting, Tax, and Financial Reports for Lateen OS. Real,
 * deterministic, offline implementation — see `runtime.ts`'s
 * `createFinanceRuntime()` for the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as financialOrganization from './financial-organization/index.js';
export * as account from './account/index.js';
export * as journalEntry from './journal-entry/index.js';
export * as accountsReceivable from './accounts-receivable/index.js';
export * as accountsPayable from './accounts-payable/index.js';
export * as treasury from './treasury/index.js';
export * as budget from './budget/index.js';
export * as tax from './tax/index.js';
export * as report from './report/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createFinanceRuntime,
  type FinanceRuntime,
  type FinanceRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { FiscalYear, FiscalYearStatus, FiscalPeriod, FiscalPeriodStatus, AccountingSettings, NumberingSequence, NumberingSequenceType } from './financial-organization/types.js';
export type { ExchangeRate, ExchangeRateProvider } from './financial-organization/exchange-rate.js';
export type { Account, AccountType, AccountStatus, NormalBalance } from './account/types.js';
export type { JournalEntry, JournalEntryStatus, JournalLine, RecurringJournalTemplate, RecurringFrequency } from './journal-entry/types.js';
export type { ARCustomer, ARInvoice, ARInvoiceStatus, ARInvoiceLine, CreditNote, CreditNoteStatus, ARPayment, AgingReport as ARAgingReport } from './accounts-receivable/types.js';
export type { Vendor, Bill, BillStatus, BillLine, VendorCredit, VendorCreditStatus, APPayment, AgingReport as APAgingReport } from './accounts-payable/types.js';
export type { CashAccount, CashAccountSubtype, TreasuryTransaction, TreasuryTransactionType, Reconciliation, ReconciliationStatus } from './treasury/types.js';
export type { Budget, BudgetScope, BudgetStatus, BudgetLine, BudgetRevision, BudgetVarianceReport } from './budget/types.js';
export type { TaxRule, TaxType, TaxCalculation } from './tax/types.js';
export type {
  FinanceReport,
  FinanceReportType,
  BalanceSheetData,
  IncomeStatementData,
  TrialBalanceData,
  CashFlowData,
  GeneralLedgerReportData,
} from './report/types.js';

/** Real lifecycle/service ports. */
export { createStaticExchangeRateProvider } from './financial-organization/exchange-rate.js';
export type { FinancialOrganizationEngine, CreateFiscalYearInput, UpsertAccountingSettingsInput, RegisterNumberingSequenceInput } from './financial-organization/engine.impl.js';
export { canTransitionAccount, normalBalanceForAccountType, type ChartOfAccountsEngine, type CreateAccountInput, type UpdateAccountInput } from './account/engine.impl.js';
export {
  canTransitionJournalEntry,
  sumDebits,
  sumCredits,
  isBalanced,
  computeAccountNetAmount,
  computeNextOccurrence,
  type GeneralLedgerEngine,
  type CreateJournalEntryInput,
  type CreateRecurringJournalTemplateInput,
} from './journal-entry/engine.impl.js';
export {
  canTransitionARInvoice,
  canTransitionCreditNote,
  computeInvoiceTotals,
  agingBucketForDaysOverdue,
  type AccountsReceivableEngine,
  type CreateARCustomerInput,
  type CreateARInvoiceInput,
  type RecordARPaymentInput,
  type CreateCreditNoteInput,
} from './accounts-receivable/engine.impl.js';
export {
  canTransitionBill,
  canTransitionVendorCredit,
  computeBillTotals,
  type AccountsPayableEngine,
  type CreateVendorInput,
  type CreateBillInput,
  type RecordAPPaymentInput,
  type CreateVendorCreditInput,
} from './accounts-payable/engine.impl.js';
export {
  type TreasuryEngine,
  type CreateCashAccountInput,
  type RecordTreasuryMovementInput,
} from './treasury/engine.impl.js';
export {
  canTransitionBudget,
  computeVariance,
  type BudgetEngine,
  type CreateBudgetInput,
} from './budget/engine.impl.js';
export {
  calculateTax,
  type TaxEngine,
  type CreateTaxRuleInput,
  type UpdateTaxRuleInput,
} from './tax/engine.impl.js';
export { type FinanceReportEngine } from './report/engine.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { FiscalYearRepository, FiscalPeriodRepository, AccountingSettingsRepository, NumberingSequenceRepository } from './financial-organization/repository.js';
export type { AccountRepository } from './account/repository.js';
export type { JournalEntryRepository, RecurringJournalTemplateRepository } from './journal-entry/repository.js';
export type { ARCustomerRepository, ARInvoiceRepository, CreditNoteRepository, ARPaymentRepository } from './accounts-receivable/repository.js';
export type { VendorRepository, BillRepository, VendorCreditRepository, APPaymentRepository } from './accounts-payable/repository.js';
export type { CashAccountRepository, TreasuryTransactionRepository, ReconciliationRepository } from './treasury/repository.js';
export type { BudgetRepository, BudgetRevisionRepository } from './budget/repository.js';
export type { TaxRuleRepository, TaxCalculationRepository } from './tax/repository.js';
export type { FinanceReportRepository } from './report/repository.js';

/** Relationship Layer (CRM Engine / Sales Engine / Business DNA / Workflow Engine / Communication Hub / Analytics Engine / Institutional Memory integration). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Real query layer. */
export type { FinanceQueries } from './queries/finance-queries.js';

/** Typed event bus. */
export type { FinanceDomainEvent } from './events/finance-events.js';
export { FINANCE_EVENT_NAMES } from './events/finance-events.js';
export type { FinanceEventBus } from './events/finance-event-bus.js';
