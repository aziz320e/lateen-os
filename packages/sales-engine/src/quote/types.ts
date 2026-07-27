/** @module quote/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CustomerId, ProductId, QuoteId, QuoteVersionId, SalesOpportunityId } from '../shared/identifiers.js';
import type { CurrencyCode } from '../shared/primitives.js';

export type { QuoteId, QuoteVersionId };

export type QuoteStatus = 'draft' | 'archived';

/** A single priced line within a quote. */
export interface QuoteLineItem {
  readonly productId?: ProductId;
  readonly description: string;
  readonly quantity: string;
  readonly unitPrice: string;
  /** Line-level discount, applied before the quote-level discount. */
  readonly discountPct?: string;
}

/** Deterministic, computed quote totals. */
export interface QuoteTotals {
  readonly subtotal: string;
  readonly discountTotal: string;
  readonly taxTotal: string;
  readonly total: string;
}

/** A priced, versioned commercial quote for a sales opportunity. */
export interface Quote extends TenantAuditableEntity<QuoteId> {
  readonly title: string;
  readonly opportunityId?: SalesOpportunityId;
  readonly customerId?: CustomerId;
  readonly currency: CurrencyCode;
  readonly lineItems: readonly QuoteLineItem[];
  /** Quote-level discount, applied after every line item's own discount. */
  readonly discountPct?: string;
  readonly taxRatePct?: string;
  readonly totals: QuoteTotals;
  readonly status: QuoteStatus;
  readonly currentVersion: number;
}

/** Immutable snapshot of a {@link Quote} at a point in its version history. */
export interface QuoteVersion {
  readonly id: QuoteVersionId;
  readonly organizationId: Quote['organizationId'];
  readonly quoteId: QuoteId;
  readonly versionNumber: number;
  readonly snapshot: Quote;
  readonly createdAt: string;
}

export type { OrganizationId } from '../shared/identifiers.js';
