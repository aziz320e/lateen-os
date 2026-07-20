/**
 * Shared commercial document value objects for quotations, orders, and invoices.
 *
 * @module shared/commercial
 */

import type { LineItemId, ProductId, ServiceId } from './identifiers.js';
import type { CurrencyCode } from './primitives.js';

/** Line item on a quotation, order, or invoice. */
export interface CommercialLineItem {
  readonly lineId: LineItemId;
  readonly productId?: ProductId;
  readonly serviceId?: ServiceId;
  readonly description: string;
  readonly quantity: string;
  readonly unitPrice: string;
  readonly discount?: string;
  readonly total: string;
}

/** Monetary totals on a commercial document. */
export interface CommercialTotals {
  readonly subtotal: string;
  readonly discount?: string;
  readonly tax?: string;
  readonly total: string;
  readonly currency: CurrencyCode;
}

/** Order line item with fulfillment tracking. */
export interface OrderLineItem extends CommercialLineItem {
  readonly fulfilledQuantity?: string;
}
