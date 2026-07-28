/**
 * Identifier types for the Finance Engine bounded context.
 *
 * Where a sibling package already owns a canonical id (Organization,
 * Customer, Supplier, Employee, Department, Project from Business
 * DNA; Sales Opportunity from Sales Engine), it is reused directly
 * rather than redefined.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { CustomerId, DepartmentId, EmployeeId, OrganizationId, ProjectId, SupplierId } from '@lateen-os/business-dna';
export type { SalesOpportunityId } from '@lateen-os/sales-engine';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Financial Organization. */
export type FiscalYearId = Identifier;
export type FiscalPeriodId = Identifier;
export type AccountingSettingsId = Identifier;
export type NumberingSequenceId = Identifier;

/** Chart of Accounts. */
export type AccountId = Identifier;

/** General Ledger. */
export type JournalEntryId = Identifier;
export type RecurringJournalTemplateId = Identifier;

/** Accounts Receivable. */
export type ARCustomerId = Identifier;
export type ARInvoiceId = Identifier;
export type CreditNoteId = Identifier;
export type ARPaymentId = Identifier;

/** Accounts Payable. */
export type VendorId = Identifier;
export type BillId = Identifier;
export type VendorCreditId = Identifier;
export type APPaymentId = Identifier;

/** Treasury. */
export type CashAccountId = Identifier;
export type TreasuryTransactionId = Identifier;
export type ReconciliationId = Identifier;

/** Budget Engine. */
export type BudgetId = Identifier;
export type BudgetRevisionId = Identifier;

/** Tax Engine. */
export type TaxRuleId = Identifier;
export type TaxCalculationId = Identifier;

/** Financial Reports. */
export type FinanceReportId = Identifier;
