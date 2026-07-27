import { describe, expect, it, vi } from 'vitest';
import { createSalesOpportunityRepository } from '../src/opportunity/repository.impl.js';
import { createSalesOpportunityLifecycle } from '../src/opportunity/lifecycle.impl.js';
import { createForecastSnapshotRepository } from '../src/forecast/repository.impl.js';
import { computeWeightedAmount, createForecastEngine, probabilityForStage, STAGE_PROBABILITY } from '../src/forecast/engine.impl.js';
import { createSalesEventBus } from '../src/events/sales-event-bus.js';

const ORG = 'org-1';

describe('STAGE_PROBABILITY / probabilityForStage', () => {
  it('assigns increasing probability through the pipeline', () => {
    expect(STAGE_PROBABILITY.new).toBeLessThan(STAGE_PROBABILITY.discovery);
    expect(STAGE_PROBABILITY.discovery).toBeLessThan(STAGE_PROBABILITY.qualified);
    expect(STAGE_PROBABILITY.qualified).toBeLessThan(STAGE_PROBABILITY.proposal);
    expect(STAGE_PROBABILITY.proposal).toBeLessThan(STAGE_PROBABILITY.negotiation);
    expect(STAGE_PROBABILITY.negotiation).toBeLessThan(STAGE_PROBABILITY.verbal_commit);
  });

  it('assigns 100% to won and 0% to lost', () => {
    expect(probabilityForStage('won')).toBe(1);
    expect(probabilityForStage('lost')).toBe(0);
  });
});

describe('computeWeightedAmount (pure)', () => {
  it('weights an amount by its stage probability', () => {
    expect(computeWeightedAmount('1000.00', 'qualified')).toBe('350.00');
  });

  it('returns 0.00 for an undefined amount', () => {
    expect(computeWeightedAmount(undefined, 'won')).toBe('0.00');
  });
});

function setup(eventBus = createSalesEventBus()) {
  const opportunityRepository = createSalesOpportunityRepository();
  const opportunities = createSalesOpportunityLifecycle(opportunityRepository, eventBus);
  const forecastRepository = createForecastSnapshotRepository();
  const forecast = createForecastEngine(opportunityRepository, forecastRepository, eventBus);
  return { opportunityRepository, opportunities, forecastRepository, forecast, eventBus };
}

describe('createForecastEngine', () => {
  it('generateForecast() computes totalOpenAmount and weightedPipelineValue over open opportunities only', async () => {
    const { opportunities, forecast } = setup();
    const a = await opportunities.create(ORG, { name: 'A', amount: '1000.00' });
    await opportunities.qualify(ORG, a.id);
    const b = await opportunities.create(ORG, { name: 'B', amount: '2000.00' });
    await opportunities.qualify(ORG, b.id);
    await opportunities.propose(ORG, b.id);
    await opportunities.negotiate(ORG, b.id);
    await opportunities.closeWon(ORG, b.id);

    const snapshot = await forecast.generateForecast(ORG);
    expect(snapshot.opportunityCount).toBe(1);
    expect(snapshot.totalOpenAmount).toBe('1000.00');
    expect(snapshot.weightedPipelineValue).toBe('350.00');
  });

  it('generateForecast() excludes archived opportunities', async () => {
    const { opportunities, forecast } = setup();
    const a = await opportunities.create(ORG, { name: 'A', amount: '500.00' });
    await opportunities.archive(ORG, a.id);
    const snapshot = await forecast.generateForecast(ORG);
    expect(snapshot.opportunityCount).toBe(0);
  });

  it('generateForecast() groups open opportunities into monthly buckets by expectedCloseDate', async () => {
    const { opportunities, forecast } = setup();
    await opportunities.create(ORG, { name: 'A', amount: '1000.00', expectedCloseDate: '2026-03-15T00:00:00.000Z' });
    await opportunities.create(ORG, { name: 'B', amount: '2000.00', expectedCloseDate: '2026-03-20T00:00:00.000Z' });
    await opportunities.create(ORG, { name: 'C', amount: '500.00', expectedCloseDate: '2026-04-01T00:00:00.000Z' });

    const snapshot = await forecast.generateForecast(ORG);
    const march = snapshot.monthlyForecast.find((bucket) => bucket.month === '2026-03');
    const april = snapshot.monthlyForecast.find((bucket) => bucket.month === '2026-04');
    expect(march?.totalAmount).toBe('3000.00');
    expect(march?.opportunityCount).toBe(2);
    expect(april?.totalAmount).toBe('500.00');
  });

  it('generateForecast() buckets opportunities with no expectedCloseDate as unscheduled, sorted last', async () => {
    const { opportunities, forecast } = setup();
    await opportunities.create(ORG, { name: 'A', amount: '1000.00', expectedCloseDate: '2026-01-01T00:00:00.000Z' });
    await opportunities.create(ORG, { name: 'B', amount: '500.00' });

    const snapshot = await forecast.generateForecast(ORG);
    expect(snapshot.monthlyForecast.at(-1)?.month).toBe('unscheduled');
  });

  it('generateForecast() persists a snapshot retrievable via getLatestForecast() and listForecasts()', async () => {
    const { forecast } = setup();
    const first = await forecast.generateForecast(ORG);
    const second = await forecast.generateForecast(ORG);

    const latest = await forecast.getLatestForecast(ORG);
    expect(latest?.id).toBe(second.id);

    const all = await forecast.listForecasts(ORG);
    expect(all.map((snapshot) => snapshot.id)).toEqual(expect.arrayContaining([first.id, second.id]));
  });

  it('getLatestForecast() returns null when nothing has been generated', async () => {
    const { forecast } = setup();
    expect(await forecast.getLatestForecast(ORG)).toBeNull();
  });

  it('publishes forecast.updated', async () => {
    const eventBus = createSalesEventBus();
    const updated = vi.fn();
    eventBus.subscribe('forecast.updated', updated);
    const { forecast } = setup(eventBus);
    await forecast.generateForecast(ORG);
    await Promise.resolve();
    expect(updated).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { opportunities, forecast } = setup();
    await opportunities.create(ORG, { name: 'A', amount: '1000.00' });
    const snapshot = await forecast.generateForecast('org-2');
    expect(snapshot.opportunityCount).toBe(0);
  });
});
