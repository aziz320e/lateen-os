/** @module accounts-payable/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { APPaymentId, BillId, SupplierId, VendorCreditId, VendorId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate, ISODateTime } from '../shared/primitives.js';

export type { APPaymentId, BillId, VendorCreditId, VendorId };

/** A finance-side vendor ledger record — optionally linked to a real Business DNA supplier. */
export interface Vendor extends TenantAuditableEntity<VendorId> {
  readonly displayName: string;
  readonly externalSupplierId?: SupplierId;
  readonly paymentTermsDays: number;
  readonly currency: CurrencyCode;
}

export type BillStatus = 'draft' | 'received' | 'partially_paid' | 'paid' | 'cancelled';

export interface BillLineInput {
  readonly description: string;
  readonly quantity: string;
  readonly unitPrice: string;
  readonly taxRatePct?: string;
}

export interface BillLine extends BillLineInput {
  readonly amount: string;
}

export interface BillTotals {
  readonly subtotal: string;
  readonly taxTotal: string;
  readonly total: string;
}

export interface Bill extends TenantAuditableEntity<BillId> {
  readonly billNumber?: string;
  readonly vendorId: VendorId;
  readonly billDate?: ISODate;
  readonly dueDate?: ISODate;
  readonly lines: readonly BillLine[];
  readonly currency: CurrencyCode;
  readonly subtotal: string;
  readonly taxTotal: string;
  readonly total: string;
  readonly amountPaid: string;
  readonly balanceDue: string;
  readonly status: BillStatus;
}

export type VendorCreditStatus = 'draft' | 'issued' | 'applied' | 'cancelled';

export interface VendorCredit extends TenantAuditableEntity<VendorCreditId> {
  readonly vendorCreditNumber?: string;
  readonly vendorId: VendorId;
  readonly billId?: BillId;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly reason?: string;
  readonly status: VendorCreditStatus;
}

export interface APPayment extends TenantAuditableEntity<APPaymentId> {
  readonly vendorId: VendorId;
  readonly billId: BillId;
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

export interface VendorAgingLine {
  readonly vendorId: VendorId;
  readonly buckets: AgingBucketAmounts;
  readonly total: string;
}

export interface AgingReport {
  readonly asOf: ISODate;
  readonly buckets: AgingBucketAmounts;
  readonly byVendor: readonly VendorAgingLine[];
  readonly total: string;
}
