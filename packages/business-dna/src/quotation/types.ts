/** @module quotation/types */
import type { Entity } from '../shared/entity.js';
import type {
  BranchId,
  CustomerId,
  EmployeeId,
  OrganizationId,
  QuotationId,
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

export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'archived';

export interface Quotation extends Entity<QuotationId>, TenantScoped, Auditable {
  readonly number: DocumentNumber;
  readonly customerId: CustomerId;
  readonly status: QuotationStatus;
  readonly currency: CurrencyCode;
  readonly subtotal: string;
  readonly discount?: string;
  readonly tax?: string;
  readonly total: string;
  readonly lineItems: readonly CommercialLineItem[];
  readonly validUntil?: ISODate;
  readonly paymentTerms?: string;
  readonly notes?: string;
  readonly createdById: EmployeeId;
  readonly branchId?: BranchId;
  readonly sentAt?: ISODateTime;
  readonly acceptedAt?: ISODateTime;
}

export type { OrganizationId };
