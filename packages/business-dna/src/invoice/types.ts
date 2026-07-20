/** @module invoice/types */
import type { Entity } from '../shared/entity.js';
import type {
  BranchId,
  CustomerId,
  InvoiceId,
  OrderId,
  OrganizationId,
  SupplierId,
} from '../shared/identifiers.js';
import type { CommercialLineItem } from '../shared/commercial.js';
import type {
  Auditable,
  CurrencyCode,
  DocumentNumber,
  ISODate,
  ISODateTime,
  TenantScoped,
} from '../shared/primitives.js';

export type InvoiceType = 'sales' | 'purchase' | 'credit_note' | 'debit_note';
export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'void'
  | 'archived';

export interface Invoice extends Entity<InvoiceId>, TenantScoped, Auditable {
  readonly number: DocumentNumber;
  readonly type: InvoiceType;
  readonly status: InvoiceStatus;
  readonly customerId?: CustomerId;
  readonly supplierId?: SupplierId;
  readonly orderId?: OrderId;
  readonly currency: CurrencyCode;
  readonly subtotal: string;
  readonly discount?: string;
  readonly tax?: string;
  readonly total: string;
  readonly amountPaid?: string;
  readonly amountDue: string;
  readonly lineItems: readonly CommercialLineItem[];
  readonly issueDate: ISODate;
  readonly dueDate?: ISODate;
  readonly paidAt?: ISODateTime;
  readonly branchId?: BranchId;
}

export type { OrganizationId };
