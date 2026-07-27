import { describe, expect, it } from 'vitest';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createRevenueAnalyticsRepository } from '../src/revenue-analytics/repository.impl.js';
import { computeGrowthPercentage, createRevenueAnalyticsEngine, sumRevenueInPeriod } from '../src/revenue-analytics/engine.impl.js';

const ORG = 'org-1';
const ASOF = '2026-06-15T00:00:00.000Z';

describe('computeGrowthPercentage (pure)', () => {
  it('computes percentage change, 0 for zero previous', () => {
    expect(computeGrowthPercentage(100, 150)).toBe(50);
    expect(computeGrowthPercentage(0, 150)).toBe(0);
  });
});

describe('sumRevenueInPeriod (pure)', () => {
  const deals = [
    { amount: '100', closedAt: '2026-06-01T00:00:00.000Z' },
    { amount: '200', closedAt: '2026-06-15T00:00:00.000Z' },
    { amount: '300', closedAt: '2026-05-01T00:00:00.000Z' },
  ];

  it('sums deals within the same calendar month', () => {
    expect(sumRevenueInPeriod(deals, ASOF, 'month')).toBe(300);
  });

  it('sums deals within the same calendar year', () => {
    expect(sumRevenueInPeriod(deals, ASOF, 'year')).toBe(600);
  });

  it('excludes deals with no closedAt', () => {
    expect(sumRevenueInPeriod([{ amount: '100' }], ASOF, 'month')).toBe(0);
  });
});

function setup() {
  const repository = createRevenueAnalyticsRepository();
  return { repository };
}

describe('createRevenueAnalyticsEngine — fully offline (no collaborators injected)', () => {
  it('returns a zeroed snapshot when neither Sales Engine nor CRM Engine is injected', async () => {
    const { repository } = setup();
    const engine = createRevenueAnalyticsEngine(repository, {});
    const snapshot = await engine.computeSnapshot(ORG, { asOf: ASOF });
    expect(snapshot.mrr).toBe(0);
    expect(snapshot.arr).toBe(0);
    expect(snapshot.revenueByProduct).toEqual({});
    expect(snapshot.revenueByMarket).toEqual({});
  });
});

describe('createRevenueAnalyticsEngine — with real Sales Engine and CRM Engine', () => {
  async function seedWonDeal() {
    const sales = createSalesRuntime({ now: () => ASOF });
    const crm = createCrmRuntime({ now: () => ASOF });

    const account = await crm.accounts.create(ORG, { name: 'Acme Corp', industry: 'manufacturing' });

    const opportunity = await sales.opportunities.create(ORG, { name: 'Acme Deal', accountId: account.id, amount: '1200', expectedCloseDate: ASOF });
    await sales.opportunities.advanceStage(ORG, opportunity.id, 'discovery');
    await sales.opportunities.advanceStage(ORG, opportunity.id, 'qualified');
    await sales.opportunities.advanceStage(ORG, opportunity.id, 'proposal');
    await sales.opportunities.advanceStage(ORG, opportunity.id, 'negotiation');
    const won = await sales.opportunities.closeWon(ORG, opportunity.id);

    const quote = await sales.quotes.createQuote(ORG, {
      title: 'Acme Quote',
      opportunityId: won.id,
      currency: 'USD',
      lineItems: [{ productId: 'product-1', description: 'Widget', quantity: '2', unitPrice: '600' }],
    });

    return { sales, crm, opportunity: won, quote };
  }

  it('computes MRR/ARR from real closed-won Sales Engine opportunities', async () => {
    const { sales } = await seedWonDeal();
    const { repository } = setup();
    const engine = createRevenueAnalyticsEngine(repository, { sales });
    const snapshot = await engine.computeSnapshot(ORG, { asOf: ASOF });
    expect(snapshot.monthlyRevenue).toBe(1200);
    expect(snapshot.mrr).toBe(1200);
    expect(snapshot.arr).toBe(14400);
  });

  it('computes revenue by product from real Sales Engine quotes', async () => {
    const { sales } = await seedWonDeal();
    const { repository } = setup();
    const engine = createRevenueAnalyticsEngine(repository, { sales });
    const snapshot = await engine.computeSnapshot(ORG, { asOf: ASOF });
    expect(snapshot.revenueByProduct['product-1']).toBe(1200);
  });

  it('computes revenue by market from the real CRM account industry', async () => {
    const { sales, crm } = await seedWonDeal();
    const { repository } = setup();
    const engine = createRevenueAnalyticsEngine(repository, { sales, crm });
    const snapshot = await engine.computeSnapshot(ORG, { asOf: ASOF });
    expect(snapshot.revenueByMarket.manufacturing).toBe(1200);
  });

  it('falls back to "unknown" market when CRM Engine is not injected', async () => {
    const { sales } = await seedWonDeal();
    const { repository } = setup();
    const engine = createRevenueAnalyticsEngine(repository, { sales });
    const snapshot = await engine.computeSnapshot(ORG, { asOf: ASOF });
    expect(snapshot.revenueByMarket.unknown).toBe(1200);
  });

  it('computes growth against a previous period', async () => {
    const { sales } = await seedWonDeal();
    const { repository } = setup();
    const engine = createRevenueAnalyticsEngine(repository, { sales });
    const snapshot = await engine.computeSnapshot(ORG, { asOf: ASOF, previousAsOf: '2026-05-15T00:00:00.000Z' });
    expect(snapshot.growthPercentage).toBe(0);
  });
});

describe('createRevenueAnalyticsEngine — get / list / org scoping', () => {
  it('get() returns null for an unknown snapshot', async () => {
    const { repository } = setup();
    const engine = createRevenueAnalyticsEngine(repository, {});
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every computed snapshot', async () => {
    const { repository } = setup();
    const engine = createRevenueAnalyticsEngine(repository, {});
    await engine.computeSnapshot(ORG, { asOf: ASOF });
    await engine.computeSnapshot(ORG, { asOf: ASOF });
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { repository } = setup();
    const engine = createRevenueAnalyticsEngine(repository, {});
    const snapshot = await engine.computeSnapshot(ORG, { asOf: ASOF });
    expect(await repository.findById('org-2', snapshot.id)).toBeNull();
  });
});
