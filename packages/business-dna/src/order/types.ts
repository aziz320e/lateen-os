/** @module order/types */
import type { Entity } from '../shared/entity.js';
import type {
  BranchId,
  CustomerId,
  EmployeeId,
  OrderId,
  OrganizationId,
  ProjectId,
  QuotationId,
} from '../shared/identifiers.js';
import type { OrderLineItem } from '../shared/commercial.js';
import type {
  Auditable,
  CurrencyCode,
  DocumentNumber,
  ISODate,
  ISODateTime,
  TenantScoped,
} from '../shared/primitives.js';

export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'in_progress'
  | 'fulfilled'
  | 'partially_fulfilled'
  | 'cancelled'
  | 'archived';

export interface Order extends Entity<OrderId>, TenantScoped, Auditable {
  readonly number: DocumentNumber;
  readonly customerId: CustomerId;
  readonly quotationId?: QuotationId;
  readonly status: OrderStatus;
  readonly currency: CurrencyCode;
  readonly subtotal: string;
  readonly discount?: string;
  readonly tax?: string;
  readonly total: string;
  readonly lineItems: readonly OrderLineItem[];
  readonly paymentTerms?: string;
  readonly deliveryDate?: ISODate;
  readonly ownerId?: EmployeeId;
  readonly branchId?: BranchId;
  readonly projectId?: ProjectId;
  readonly confirmedAt?: ISODateTime;
  readonly fulfilledAt?: ISODateTime;
}

export type { OrganizationId };
