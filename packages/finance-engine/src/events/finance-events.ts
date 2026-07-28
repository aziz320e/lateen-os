/** @module events/finance-events */
import type { DomainEvent } from '@lateen-os/shared-kernel/core';

export type AccountCreatedEvent = DomainEvent<
  'account.created',
  { readonly organizationId: string; readonly accountId: string; readonly accountType: string }
>;

export type JournalPostedEvent = DomainEvent<'journal.posted', { readonly organizationId: string; readonly journalEntryId: string }>;

export type InvoiceIssuedEvent = DomainEvent<
  'invoice.issued',
  { readonly organizationId: string; readonly invoiceId: string; readonly customerId: string }
>;

export type InvoicePaidEvent = DomainEvent<'invoice.paid', { readonly organizationId: string; readonly invoiceId: string }>;

export type BillCreatedEvent = DomainEvent<
  'bill.created',
  { readonly organizationId: string; readonly billId: string; readonly vendorId: string }
>;

export type BillPaidEvent = DomainEvent<'bill.paid', { readonly organizationId: string; readonly billId: string }>;

export type BudgetUpdatedEvent = DomainEvent<'budget.updated', { readonly organizationId: string; readonly budgetId: string }>;

export type TaxCalculatedEvent = DomainEvent<
  'tax.calculated',
  { readonly organizationId: string; readonly taxCalculationId: string; readonly taxRuleId: string; readonly taxAmount: string }
>;

export type ReportGeneratedEvent = DomainEvent<
  'report.generated',
  { readonly organizationId: string; readonly reportId: string; readonly reportType: string }
>;

export type PeriodClosedEvent = DomainEvent<'period.closed', { readonly organizationId: string; readonly fiscalPeriodId: string }>;

/** Canonical event names for external subscribers. */
export const FINANCE_EVENT_NAMES = {
  AccountCreated: 'account.created',
  JournalPosted: 'journal.posted',
  InvoiceIssued: 'invoice.issued',
  InvoicePaid: 'invoice.paid',
  BillCreated: 'bill.created',
  BillPaid: 'bill.paid',
  BudgetUpdated: 'budget.updated',
  TaxCalculated: 'tax.calculated',
  ReportGenerated: 'report.generated',
  PeriodClosed: 'period.closed',
} as const;

/** Union of all Finance Engine domain events. */
export type FinanceDomainEvent =
  | AccountCreatedEvent
  | JournalPostedEvent
  | InvoiceIssuedEvent
  | InvoicePaidEvent
  | BillCreatedEvent
  | BillPaidEvent
  | BudgetUpdatedEvent
  | TaxCalculatedEvent
  | ReportGeneratedEvent
  | PeriodClosedEvent;
