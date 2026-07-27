import { describe, expect, it } from 'vitest';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createSalesAnalyticsRepository } from '../src/sales-analytics/repository.impl.js';
import { computeAverageStageDurationDays, computeCloseRate, computeSalesVelocity, createSalesAnalyticsEngine } from '../src/sales-analytics/engine.impl.js';

const ORG = 'org-1';
const ASOF = '2026-06-15T00:00:00.000Z';

describe('computeCloseRate (pure)', () => {
  it('computes won / (won + lost) as a percentage', () => {
    expect(computeCloseRate(3, 1)).toBe(75);
  });

  it('returns 0 when nothing has closed', () => {
    expect(computeCloseRate(0, 0)).toBe(0);
  });
});

describe('computeSalesVelocity (pure)', () => {
  it('computes the classic sales velocity formula', () => {
    expect(computeSalesVelocity(10, 1000, 50, 30)).toBeCloseTo((10 * 1000 * 0.5) / 30, 2);
  });

  it('returns 0 when the average sales cycle is 0 days', () => {
    expect(computeSalesVelocity(10, 1000, 50, 0)).toBe(0);
  });
});

describe('computeAverageStageDurationDays (pure)', () => {
  it('computes average days since last update per stage', () => {
    const result = computeAverageStageDurationDays(
      { qualified: [{ updatedAt: '2026-06-05T00:00:00.000Z' }, { updatedAt: '2026-06-10T00:00:00.000Z' }] },
      ASOF,
    );
    expect(result.qualified).toBe(7.5);
  });

  it('skips stages with no opportunities', () => {
    const result = computeAverageStageDurationDays({ won: [] }, ASOF);
    expect(result.won).toBeUndefined();
  });
});

function setup() {
  const repository = createSalesAnalyticsRepository();
  return { repository };
}

describe('createSalesAnalyticsEngine — fully offline (no Sales Engine injected)', () => {
  it('returns a zeroed snapshot', async () => {
    const { repository } = setup();
    const engine = createSalesAnalyticsEngine(repository, {});
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.pipelineValue).toBe(0);
    expect(snapshot.closeRate).toBe(0);
    expect(snapshot.funnel).toEqual({});
  });
});

describe('createSalesAnalyticsEngine — with a real Sales Engine', () => {
  async function seedPipeline() {
    const sales = createSalesRuntime({ now: () => ASOF });

    const openDeal = await sales.opportunities.create(ORG, { name: 'Open Deal', amount: '500' });
    await sales.opportunities.advanceStage(ORG, openDeal.id, 'discovery');

    const wonDeal = await sales.opportunities.create(ORG, { name: 'Won Deal', amount: '1000' });
    await sales.opportunities.advanceStage(ORG, wonDeal.id, 'discovery');
    await sales.opportunities.advanceStage(ORG, wonDeal.id, 'qualified');
    await sales.opportunities.advanceStage(ORG, wonDeal.id, 'proposal');
    await sales.opportunities.advanceStage(ORG, wonDeal.id, 'negotiation');
    await sales.opportunities.closeWon(ORG, wonDeal.id);

    const lostDeal = await sales.opportunities.create(ORG, { name: 'Lost Deal', amount: '300' });
    await sales.opportunities.closeLost(ORG, lostDeal.id, 'budget');

    return { sales };
  }

  it('computes pipeline value over open (non-terminal) opportunities only', async () => {
    const { sales } = await seedPipeline();
    const { repository } = setup();
    const engine = createSalesAnalyticsEngine(repository, { sales });
    const snapshot = await engine.computeSnapshot(ORG, { asOf: ASOF });
    expect(snapshot.pipelineValue).toBe(500);
  });

  it('computes the conversion funnel across every stage', async () => {
    const { sales } = await seedPipeline();
    const { repository } = setup();
    const engine = createSalesAnalyticsEngine(repository, { sales });
    const snapshot = await engine.computeSnapshot(ORG, { asOf: ASOF });
    expect(snapshot.funnel.won).toBe(1);
    expect(snapshot.funnel.lost).toBe(1);
    expect(snapshot.funnel.discovery).toBe(1);
  });

  it('computes close rate from real won/lost counts', async () => {
    const { sales } = await seedPipeline();
    const { repository } = setup();
    const engine = createSalesAnalyticsEngine(repository, { sales });
    const snapshot = await engine.computeSnapshot(ORG, { asOf: ASOF });
    expect(snapshot.closeRate).toBe(50);
  });

  it('computes average deal size from real won deals', async () => {
    const { sales } = await seedPipeline();
    const { repository } = setup();
    const engine = createSalesAnalyticsEngine(repository, { sales });
    const snapshot = await engine.computeSnapshot(ORG, { asOf: ASOF });
    expect(snapshot.averageDealSize).toBe(1000);
  });
});

describe('createSalesAnalyticsEngine — get / list / org scoping', () => {
  it('get() returns null for an unknown snapshot', async () => {
    const { repository } = setup();
    const engine = createSalesAnalyticsEngine(repository, {});
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every computed snapshot', async () => {
    const { repository } = setup();
    const engine = createSalesAnalyticsEngine(repository, {});
    await engine.computeSnapshot(ORG);
    await engine.computeSnapshot(ORG);
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { repository } = setup();
    const engine = createSalesAnalyticsEngine(repository, {});
    const snapshot = await engine.computeSnapshot(ORG);
    expect(await repository.findById('org-2', snapshot.id)).toBeNull();
  });
});
