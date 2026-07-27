/**
 * Real Quote Engine — create / update / archive with deterministic
 * totals, tax, and discount calculation, plus immutable version history.
 *
 * @module quote/engine.impl
 */
import type { SalesEventBus } from '../events/sales-event-bus.js';
import { InvalidQuoteTransitionError, QuoteNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { CustomerId, OrganizationId, QuoteId, SalesOpportunityId } from '../shared/identifiers.js';
import type { CurrencyCode } from '../shared/primitives.js';
import type { QuoteRepository, QuoteVersionRepository } from './repository.js';
import type { Quote, QuoteLineItem, QuoteStatus, QuoteTotals, QuoteVersion } from './types.js';

function parseDecimal(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMoney(value: number): string {
  return value.toFixed(2);
}

/** Pure, deterministic quote totals: line-level discounts, a quote-level discount, then tax on the discounted subtotal. */
export function computeQuoteTotals(
  lineItems: readonly QuoteLineItem[],
  discountPct?: string,
  taxRatePct?: string,
): QuoteTotals {
  const subtotal = lineItems.reduce((sum, item) => {
    const lineGross = parseDecimal(item.quantity) * parseDecimal(item.unitPrice);
    const lineDiscount = lineGross * (parseDecimal(item.discountPct) / 100);
    return sum + (lineGross - lineDiscount);
  }, 0);

  const discountTotal = subtotal * (parseDecimal(discountPct) / 100);
  const discountedSubtotal = subtotal - discountTotal;
  const taxTotal = discountedSubtotal * (parseDecimal(taxRatePct) / 100);
  const total = discountedSubtotal + taxTotal;

  return {
    subtotal: toMoney(subtotal),
    discountTotal: toMoney(discountTotal),
    taxTotal: toMoney(taxTotal),
    total: toMoney(total),
  };
}

export interface CreateQuoteInput {
  readonly title: string;
  readonly opportunityId?: SalesOpportunityId;
  readonly customerId?: CustomerId;
  readonly currency: CurrencyCode;
  readonly lineItems: readonly QuoteLineItem[];
  readonly discountPct?: string;
  readonly taxRatePct?: string;
}

export interface UpdateQuoteInput {
  readonly title?: string;
  readonly customerId?: CustomerId;
  readonly lineItems?: readonly QuoteLineItem[];
  readonly discountPct?: string;
  readonly taxRatePct?: string;
}

export interface QuoteEngine {
  createQuote(organizationId: OrganizationId, input: CreateQuoteInput): Promise<Quote>;
  updateQuote(organizationId: OrganizationId, quoteId: QuoteId, patch: UpdateQuoteInput): Promise<Quote>;
  archiveQuote(organizationId: OrganizationId, quoteId: QuoteId): Promise<Quote>;
  getQuote(organizationId: OrganizationId, quoteId: QuoteId): Promise<Quote | null>;
  /** Every version snapshot for a quote, oldest first. */
  getVersionHistory(organizationId: OrganizationId, quoteId: QuoteId): Promise<readonly QuoteVersion[]>;
}

/** Creates a real {@link QuoteEngine} backed by a {@link QuoteRepository} and {@link QuoteVersionRepository}. */
export function createQuoteEngine(
  repository: QuoteRepository,
  versionRepository: QuoteVersionRepository,
  eventBus?: SalesEventBus,
  now: () => string = nowIso,
): QuoteEngine {
  async function requireQuote(organizationId: OrganizationId, quoteId: QuoteId): Promise<Quote> {
    const quote = await repository.findById(organizationId, quoteId);
    if (!quote) throw new QuoteNotFoundError(quoteId);
    return quote;
  }

  async function snapshotVersion(quote: Quote): Promise<void> {
    const version: QuoteVersion = {
      id: generateId('quote-version'),
      organizationId: quote.organizationId,
      quoteId: quote.id,
      versionNumber: quote.currentVersion,
      snapshot: quote,
      createdAt: now(),
    };
    await versionRepository.save(version);
  }

  return {
    async createQuote(organizationId, input) {
      const timestamp = now();
      const totals = computeQuoteTotals(input.lineItems, input.discountPct, input.taxRatePct);
      const quote: Quote = {
        id: generateId('quote'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        title: input.title,
        opportunityId: input.opportunityId,
        customerId: input.customerId,
        currency: input.currency,
        lineItems: input.lineItems,
        discountPct: input.discountPct,
        taxRatePct: input.taxRatePct,
        totals,
        status: 'draft',
        currentVersion: 1,
      };
      await repository.save(quote);
      await snapshotVersion(quote);
      eventBus?.publish('quote.created', { quoteId: quote.id, organizationId, opportunityId: quote.opportunityId });
      return quote;
    },

    async updateQuote(organizationId, quoteId, patch) {
      const quote = await requireQuote(organizationId, quoteId);
      if (quote.status !== 'draft') {
        throw new InvalidQuoteTransitionError(quoteId, quote.status, 'updated');
      }
      const lineItems = patch.lineItems ?? quote.lineItems;
      const discountPct = patch.discountPct ?? quote.discountPct;
      const taxRatePct = patch.taxRatePct ?? quote.taxRatePct;
      const totals = computeQuoteTotals(lineItems, discountPct, taxRatePct);

      const updated: Quote = {
        ...quote,
        title: patch.title ?? quote.title,
        customerId: patch.customerId ?? quote.customerId,
        lineItems,
        discountPct,
        taxRatePct,
        totals,
        currentVersion: quote.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      await snapshotVersion(updated);
      return updated;
    },

    async archiveQuote(organizationId, quoteId) {
      const quote = await requireQuote(organizationId, quoteId);
      if (quote.status === 'archived') {
        throw new InvalidQuoteTransitionError(quoteId, quote.status, 'archived');
      }
      const updated: Quote = { ...quote, status: 'archived', currentVersion: quote.currentVersion + 1, updatedAt: now() };
      await repository.save(updated);
      await snapshotVersion(updated);
      return updated;
    },

    async getQuote(organizationId, quoteId) {
      return repository.findById(organizationId, quoteId);
    },

    async getVersionHistory(organizationId, quoteId) {
      return versionRepository.findAllByQuote(organizationId, quoteId);
    },
  };
}
