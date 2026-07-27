import { describe, expect, it, vi } from 'vitest';
import { createMarketingMetricsRepository } from '../src/metrics/repository.impl.js';
import { computeDerivedMetrics, createMarketingMetricsEngine } from '../src/metrics/engine.impl.js';
import { createMarketingEventBus } from '../src/events/marketing-event-bus.js';

const ORG = 'org-1';

describe('computeDerivedMetrics (pure)', () => {
  it('computes CPL, CAC, and ROI from raw counters', () => {
    const derived = computeDerivedMetrics({ conversions: 10, customersAcquired: 2, cost: '500.00', revenue: '2000.00' });
    expect(derived.cpl).toBe('50.00');
    expect(derived.cac).toBe('250.00');
    expect(derived.roi).toBe('300.00');
  });

  it('returns 0.00 for every ratio when its denominator is zero', () => {
    const derived = computeDerivedMetrics({ conversions: 0, customersAcquired: 0, cost: '0.00', revenue: '0.00' });
    expect(derived).toEqual({ cpl: '0.00', cac: '0.00', roi: '0.00' });
  });

  it('reports a negative ROI when revenue is below cost', () => {
    const derived = computeDerivedMetrics({ conversions: 1, customersAcquired: 1, cost: '1000.00', revenue: '500.00' });
    expect(derived.roi).toBe('-50.00');
  });
});

function setup(eventBus = createMarketingEventBus()) {
  const repository = createMarketingMetricsRepository();
  const engine = createMarketingMetricsEngine(repository, eventBus);
  return { repository, engine, eventBus };
}

describe('createMarketingMetricsEngine', () => {
  it('getMetrics() returns zeroed counters for a campaign with nothing recorded', async () => {
    const { engine } = setup();
    const metrics = await engine.getMetrics(ORG, 'campaign-1');
    expect(metrics.impressions).toBe(0);
    expect(metrics.cpl).toBe('0.00');
  });

  it('recordMetrics() additively accumulates counters across calls', async () => {
    const { engine } = setup();
    await engine.recordMetrics(ORG, 'campaign-1', { impressions: 1000, clicks: 50, cost: '100.00' });
    const second = await engine.recordMetrics(ORG, 'campaign-1', { impressions: 500, clicks: 25, cost: '50.00' });
    expect(second.impressions).toBe(1500);
    expect(second.clicks).toBe(75);
    expect(second.cost).toBe('150.00');
  });

  it('recordMetrics() recomputes derived figures on every call', async () => {
    const { engine } = setup();
    const metrics = await engine.recordMetrics(ORG, 'campaign-1', { conversions: 5, customersAcquired: 1, cost: '250.00', revenue: '1000.00' });
    expect(metrics.cpl).toBe('50.00');
    expect(metrics.cac).toBe('250.00');
    expect(metrics.roi).toBe('300.00');
  });

  it('listMetrics() returns every campaign recorded for the organization', async () => {
    const { engine } = setup();
    await engine.recordMetrics(ORG, 'campaign-1', { impressions: 100 });
    await engine.recordMetrics(ORG, 'campaign-2', { impressions: 200 });
    const all = await engine.listMetrics(ORG);
    expect(all).toHaveLength(2);
  });

  it('publishes metrics.updated', async () => {
    const eventBus = createMarketingEventBus();
    const updated = vi.fn();
    eventBus.subscribe('metrics.updated', updated);
    const { engine } = setup(eventBus);
    await engine.recordMetrics(ORG, 'campaign-1', { impressions: 100 });
    await Promise.resolve();
    expect(updated).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { engine } = setup();
    await engine.recordMetrics(ORG, 'campaign-1', { impressions: 100 });
    const other = await engine.getMetrics('org-2', 'campaign-1');
    expect(other.impressions).toBe(0);
  });
});
