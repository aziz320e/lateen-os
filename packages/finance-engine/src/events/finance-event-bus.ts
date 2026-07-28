/**
 * Real, typed event bus for the Finance Engine runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/finance-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type FinanceEventMap = {
  'account.created': { readonly organizationId: string; readonly accountId: string; readonly accountType: string };
  'journal.posted': { readonly organizationId: string; readonly journalEntryId: string };
  'invoice.issued': { readonly organizationId: string; readonly invoiceId: string; readonly customerId: string };
  'invoice.paid': { readonly organizationId: string; readonly invoiceId: string };
  'bill.created': { readonly organizationId: string; readonly billId: string; readonly vendorId: string };
  'bill.paid': { readonly organizationId: string; readonly billId: string };
  'budget.updated': { readonly organizationId: string; readonly budgetId: string };
  'tax.calculated': { readonly organizationId: string; readonly taxCalculationId: string; readonly taxRuleId: string; readonly taxAmount: string };
  'report.generated': { readonly organizationId: string; readonly reportId: string; readonly reportType: string };
  'period.closed': { readonly organizationId: string; readonly fiscalPeriodId: string };
};

export type FinanceEventBus = EventBus<FinanceEventMap>;

/** Creates an in-memory {@link FinanceEventBus}. */
export function createFinanceEventBus(): FinanceEventBus {
  return createEventBus<FinanceEventMap>();
}
