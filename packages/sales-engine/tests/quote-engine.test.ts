import { describe, expect, it, vi } from 'vitest';
import { createQuoteRepository, createQuoteVersionRepository } from '../src/quote/repository.impl.js';
import { computeQuoteTotals, createQuoteEngine } from '../src/quote/engine.impl.js';
import { createSalesEventBus } from '../src/events/sales-event-bus.js';
import { InvalidQuoteTransitionError, QuoteNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createSalesEventBus()) {
  const repository = createQuoteRepository();
  const versionRepository = createQuoteVersionRepository();
  const engine = createQuoteEngine(repository, versionRepository, eventBus);
  return { repository, versionRepository, engine, eventBus };
}

describe('computeQuoteTotals (pure)', () => {
  it('computes a simple subtotal with no discount or tax', () => {
    const totals = computeQuoteTotals([{ description: 'Sign', quantity: '2', unitPrice: '100.00' }]);
    expect(totals.subtotal).toBe('200.00');
    expect(totals.discountTotal).toBe('0.00');
    expect(totals.taxTotal).toBe('0.00');
    expect(totals.total).toBe('200.00');
  });

  it('applies a line-level discount before the subtotal', () => {
    const totals = computeQuoteTotals([{ description: 'Sign', quantity: '2', unitPrice: '100.00', discountPct: '10' }]);
    expect(totals.subtotal).toBe('180.00');
  });

  it('applies a quote-level discount after line totals', () => {
    const totals = computeQuoteTotals([{ description: 'Sign', quantity: '1', unitPrice: '100.00' }], '20');
    expect(totals.subtotal).toBe('100.00');
    expect(totals.discountTotal).toBe('20.00');
    expect(totals.total).toBe('80.00');
  });

  it('applies tax on the discounted subtotal, not the raw subtotal', () => {
    const totals = computeQuoteTotals([{ description: 'Sign', quantity: '1', unitPrice: '100.00' }], '10', '15');
    expect(totals.discountTotal).toBe('10.00');
    expect(totals.taxTotal).toBe('13.50');
    expect(totals.total).toBe('103.50');
  });

  it('sums multiple line items', () => {
    const totals = computeQuoteTotals([
      { description: 'Sign A', quantity: '2', unitPrice: '50.00' },
      { description: 'Sign B', quantity: '1', unitPrice: '75.00' },
    ]);
    expect(totals.subtotal).toBe('175.00');
  });

  it('returns zero totals for an empty line-item list', () => {
    const totals = computeQuoteTotals([]);
    expect(totals).toEqual({ subtotal: '0.00', discountTotal: '0.00', taxTotal: '0.00', total: '0.00' });
  });
});

describe('createQuoteEngine', () => {
  it('createQuote() computes totals and starts at version 1', async () => {
    const { engine } = setup();
    const quote = await engine.createQuote(ORG, {
      title: 'Acme Corp — Signage Package',
      currency: 'USD',
      lineItems: [{ description: 'Sign', quantity: '2', unitPrice: '100.00' }],
    });
    expect(quote.status).toBe('draft');
    expect(quote.currentVersion).toBe(1);
    expect(quote.totals.subtotal).toBe('200.00');
  });

  it('createQuote() records an initial version snapshot', async () => {
    const { engine } = setup();
    const quote = await engine.createQuote(ORG, {
      title: 'Quote',
      currency: 'USD',
      lineItems: [{ description: 'Sign', quantity: '1', unitPrice: '100.00' }],
    });
    const history = await engine.getVersionHistory(ORG, quote.id);
    expect(history).toHaveLength(1);
    expect(history[0]?.versionNumber).toBe(1);
    expect(history[0]?.snapshot.title).toBe('Quote');
  });

  it('updateQuote() recomputes totals and increments the version', async () => {
    const { engine } = setup();
    const quote = await engine.createQuote(ORG, {
      title: 'Quote',
      currency: 'USD',
      lineItems: [{ description: 'Sign', quantity: '1', unitPrice: '100.00' }],
    });
    const updated = await engine.updateQuote(ORG, quote.id, {
      lineItems: [{ description: 'Sign', quantity: '2', unitPrice: '100.00' }],
    });
    expect(updated.totals.subtotal).toBe('200.00');
    expect(updated.currentVersion).toBe(2);
  });

  it('updateQuote() rejects an archived quote', async () => {
    const { engine } = setup();
    const quote = await engine.createQuote(ORG, { title: 'Quote', currency: 'USD', lineItems: [] });
    await engine.archiveQuote(ORG, quote.id);
    await expect(engine.updateQuote(ORG, quote.id, { title: 'New' })).rejects.toBeInstanceOf(InvalidQuoteTransitionError);
  });

  it('archiveQuote() sets status archived and adds a version snapshot', async () => {
    const { engine } = setup();
    const quote = await engine.createQuote(ORG, { title: 'Quote', currency: 'USD', lineItems: [] });
    const archived = await engine.archiveQuote(ORG, quote.id);
    expect(archived.status).toBe('archived');
    const history = await engine.getVersionHistory(ORG, quote.id);
    expect(history).toHaveLength(2);
  });

  it('archiveQuote() rejects an already-archived quote', async () => {
    const { engine } = setup();
    const quote = await engine.createQuote(ORG, { title: 'Quote', currency: 'USD', lineItems: [] });
    await engine.archiveQuote(ORG, quote.id);
    await expect(engine.archiveQuote(ORG, quote.id)).rejects.toBeInstanceOf(InvalidQuoteTransitionError);
  });

  it('throws QuoteNotFoundError for an unknown quote', async () => {
    const { engine } = setup();
    await expect(engine.archiveQuote(ORG, 'missing')).rejects.toBeInstanceOf(QuoteNotFoundError);
  });

  it('getQuote() returns null for an unknown quote', async () => {
    const { engine } = setup();
    expect(await engine.getQuote(ORG, 'missing')).toBeNull();
  });

  it('getVersionHistory() returns versions oldest first', async () => {
    const { engine } = setup();
    const quote = await engine.createQuote(ORG, { title: 'Quote', currency: 'USD', lineItems: [] });
    await engine.updateQuote(ORG, quote.id, { title: 'Quote v2' });
    await engine.updateQuote(ORG, quote.id, { title: 'Quote v3' });
    const history = await engine.getVersionHistory(ORG, quote.id);
    expect(history.map((version) => version.versionNumber)).toEqual([1, 2, 3]);
    expect(history[2]?.snapshot.title).toBe('Quote v3');
  });

  it('publishes quote.created', async () => {
    const eventBus = createSalesEventBus();
    const created = vi.fn();
    eventBus.subscribe('quote.created', created);
    const { engine } = setup(eventBus);
    await engine.createQuote(ORG, { title: 'Quote', currency: 'USD', lineItems: [], opportunityId: 'opp-1' });
    await Promise.resolve();
    expect(created).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, engine } = setup();
    const quote = await engine.createQuote(ORG, { title: 'Quote', currency: 'USD', lineItems: [] });
    expect(await repository.findById('org-2', quote.id)).toBeNull();
  });
});
