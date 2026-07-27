import { describe, expect, it } from 'vitest';
import { createKpiSnapshotRepository } from '../src/kpi/repository.impl.js';
import {
  calculateAverageDealSize,
  calculateAverageResponseTimeMinutes,
  calculateConversionRate,
  calculateCustomerAcquisitionCost,
  calculateCustomerLifetimeValue,
  calculateMarketingRoi,
  calculateWinRate,
  calculateWorkflowCompletionRate,
  calculateWorkforceUtilization,
  createKpiEngine,
} from '../src/kpi/engine.impl.js';
import { createAnalyticsEventBus } from '../src/events/index.js';

const ORG = 'org-1';

describe('KPI pure calculators', () => {
  it('calculateConversionRate() returns a percentage, 0 for zero total', () => {
    expect(calculateConversionRate(25, 100)).toBe(25);
    expect(calculateConversionRate(1, 0)).toBe(0);
  });

  it('calculateWinRate() returns won / (won + lost) as a percentage', () => {
    expect(calculateWinRate(3, 1)).toBe(75);
    expect(calculateWinRate(0, 0)).toBe(0);
  });

  it('calculateAverageDealSize() divides total by count, 0 for zero count', () => {
    expect(calculateAverageDealSize(1000, 4)).toBe(250);
    expect(calculateAverageDealSize(1000, 0)).toBe(0);
  });

  it('calculateCustomerAcquisitionCost() divides cost by new customers', () => {
    expect(calculateCustomerAcquisitionCost(5000, 10)).toBe(500);
    expect(calculateCustomerAcquisitionCost(5000, 0)).toBe(0);
  });

  it('calculateCustomerLifetimeValue() multiplies deal size, frequency, and lifespan', () => {
    expect(calculateCustomerLifetimeValue(100, 2, 3)).toBe(600);
  });

  it('calculateMarketingRoi() computes percentage return, 0 for zero cost', () => {
    expect(calculateMarketingRoi(1500, 1000)).toBe(50);
    expect(calculateMarketingRoi(1500, 0)).toBe(0);
  });

  it('calculateAverageResponseTimeMinutes() averages minutes between pairs', () => {
    const value = calculateAverageResponseTimeMinutes([
      { sentAt: '2026-01-01T00:00:00.000Z', respondedAt: '2026-01-01T00:10:00.000Z' },
      { sentAt: '2026-01-01T00:00:00.000Z', respondedAt: '2026-01-01T00:20:00.000Z' },
    ]);
    expect(value).toBe(15);
  });

  it('calculateAverageResponseTimeMinutes() returns 0 for an empty set', () => {
    expect(calculateAverageResponseTimeMinutes([])).toBe(0);
  });

  it('calculateWorkflowCompletionRate() returns a percentage', () => {
    expect(calculateWorkflowCompletionRate(8, 10)).toBe(80);
  });

  it('calculateWorkforceUtilization() returns a percentage', () => {
    expect(calculateWorkforceUtilization(4, 8)).toBe(50);
  });
});

function setup(eventBus = createAnalyticsEventBus()) {
  const repository = createKpiSnapshotRepository();
  const engine = createKpiEngine(repository, eventBus);
  return { repository, engine, eventBus };
}

describe('createKpiEngine — record* methods', () => {
  it('recordRevenue() persists a currency-unit snapshot', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordRevenue(ORG, { value: 5000 });
    expect(snapshot.kpiType).toBe('revenue');
    expect(snapshot.unit).toBe('currency');
    expect(snapshot.value).toBe(5000);
  });

  it('recordConversionRate() persists a percentage-unit snapshot', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordConversionRate(ORG, { value: 40 });
    expect(snapshot.unit).toBe('percentage');
  });

  it('recordResponseTime() persists a minutes-unit snapshot', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordResponseTime(ORG, { value: 12 });
    expect(snapshot.unit).toBe('minutes');
  });

  it('recordCampaignPerformance() persists a ratio-unit snapshot', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordCampaignPerformance(ORG, { value: 1.5 });
    expect(snapshot.unit).toBe('ratio');
  });

  it('every record* method publishes kpi.updated', async () => {
    const eventBus = createAnalyticsEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('kpi.updated', (payload) => (seen = payload));
    const snapshot = await engine.recordWinRate(ORG, { value: 60 });
    expect(seen).toEqual({ organizationId: ORG, kpiSnapshotId: snapshot.id, kpiType: 'win_rate', value: 60 });
  });

  it('accepts optional context metadata', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordPipelineValue(ORG, { value: 10000, context: { source: 'sales-engine' } });
    expect(snapshot.context).toEqual({ source: 'sales-engine' });
  });

  it('all twelve KPI types are supported', async () => {
    const { engine } = setup();
    const results = await Promise.all([
      engine.recordRevenue(ORG, { value: 1 }),
      engine.recordPipelineValue(ORG, { value: 1 }),
      engine.recordConversionRate(ORG, { value: 1 }),
      engine.recordWinRate(ORG, { value: 1 }),
      engine.recordAverageDealSize(ORG, { value: 1 }),
      engine.recordCustomerAcquisitionCost(ORG, { value: 1 }),
      engine.recordCustomerLifetimeValue(ORG, { value: 1 }),
      engine.recordMarketingRoi(ORG, { value: 1 }),
      engine.recordCampaignPerformance(ORG, { value: 1 }),
      engine.recordResponseTime(ORG, { value: 1 }),
      engine.recordWorkflowCompletion(ORG, { value: 1 }),
      engine.recordWorkforceUtilization(ORG, { value: 1 }),
    ]);
    const types = new Set(results.map((r) => r.kpiType));
    expect(types.size).toBe(12);
  });
});

describe('createKpiEngine — get / findByType / getLatest / org scoping', () => {
  it('get() returns null for an unknown snapshot', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('findByType() filters correctly', async () => {
    const { engine } = setup();
    await engine.recordRevenue(ORG, { value: 100 });
    await engine.recordWinRate(ORG, { value: 50 });
    const revenueSnapshots = await engine.findByType(ORG, 'revenue');
    expect(revenueSnapshots).toHaveLength(1);
  });

  it('getLatest() returns null when nothing has been recorded', async () => {
    const { engine } = setup();
    expect(await engine.getLatest(ORG, 'revenue')).toBeNull();
  });

  it('getLatest() returns the most recently recorded snapshot', async () => {
    const { engine } = setup();
    await engine.recordRevenue(ORG, { value: 100 });
    const second = await engine.recordRevenue(ORG, { value: 200 });
    const latest = await engine.getLatest(ORG, 'revenue');
    expect(latest?.id).toBe(second.id);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const snapshot = await engine.recordRevenue(ORG, { value: 100 });
    expect(await repository.findById('org-2', snapshot.id)).toBeNull();
  });
});
