/** @module accounts-receivable/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ARCustomerId, ARInvoiceId, ARPaymentId, CreditNoteId, CustomerId, SalesOpportunityId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate, ISODateTime } from '../shared/primitives.js';

export type { ARCustomerId, ARInvoiceId, ARPaymentId, CreditNoteId };

/** A finance-side customer ledger record — optionally linked to a real CRM/Business DNA customer. */
export interface ARCustomer extends TenantAuditableEntity<ARCustomerId> {
  readonly displayName: string;
  readonly externalCustomerId?: CustomerId;
  readonly creditLimit?: string;
  readonly paymentTermsDays: number;
  readonly currency: CurrencyCode;
}

export type ARInvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled';

export interface ARInvoiceLineInput {
  readonly description: string;
  readonly quantity: string;
  readonly unitPrice: string;
  readonly taxRatePct?: string;
}

export interface ARInvoiceLine extends ARInvoiceLineInput {
  readonly amount: string;
}

/** Deterministic invoice totals computed from its lines. */
export interface ARInvoiceTotals {
  readonly subtotal: string;
  readonly taxTotal: string;
  readonly total: string;
}

export interface ARInvoice extends TenantAuditableEntity<ARInvoiceId> {
  readonly invoiceNumber?: string;
  readonly customerId: ARCustomerId;
  readonly issueDate?: ISODate;
  readonly dueDate?: ISODate;
  readonly lines: readonly ARInvoiceLine[];
  readonly currency: CurrencyCode;
  readonly subtotal: string;
  readonly taxTotal: string;
  readonly total: string;
  readonly amountPaid: string;
  readonly balanceDue: string;
  readonly status: ARInvoiceStatus;
  readonly sourceOpportunityId?: SalesOpportunityId;
}

export type CreditNoteStatus = 'draft' | 'issued' | 'applied' | 'cancelled';

export interface CreditNote extends TenantAuditableEntity<CreditNoteId> {
  readonly creditNoteNumber?: string;
  readonly customerId: ARCustomerId;
  readonly invoiceId?: ARInvoiceId;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly reason?: string;
  readonly status: CreditNoteStatus;
}

export interface ARPayment extends TenantAuditableEntity<ARPaymentId> {
  readonly customerId: ARCustomerId;
  readonly invoiceId: ARInvoiceId;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly paidAt: ISODateTime;
  readonly method?: string;
}

export type AgingBucket = 'current' | 'days_1_30' | 'days_31_60' | 'days_61_90' | 'days_90_plus';

export interface AgingBucketAmounts {
  readonly current: string;
  readonly days_1_30: string;
  readonly days_31_60: string;
  readonly days_61_90: string;
  readonly days_90_plus: string;
}

export interface CustomerAgingLine {
  readonly customerId: ARCustomerId;
  readonly buckets: AgingBucketAmounts;
  readonly total: string;
}

export interface AgingReport {
  readonly asOf: ISODate;
  readonly buckets: AgingBucketAmounts;
  readonly byCustomer: readonly CustomerAgingLine[];
  readonly total: string;
}
