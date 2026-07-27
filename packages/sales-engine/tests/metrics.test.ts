import { describe, expect, it } from 'vitest';
import { createSalesOpportunityRepository } from '../src/opportunity/repository.impl.js';
import { createSalesOpportunityLifecycle } from '../src/opportunity/lifecycle.impl.js';
import {
  computeAverageDealSize,
  computeAverageSalesCycleDays,
  computeLossRate,
  computePipelineValue,
  computeWinRate,
  createPerformanceMetricsEngine,
} from '../src/metrics/engine.impl.js';

const ORG = 'org-1';

describe('computeWinRate / computeLossRate (pure)', () => {
  it('computes complementary percentages for a mix of won and lost deals', () => {
    expect(computeWinRate(3, 1)).toBe('75.00');
    expect(computeLossRate(3, 1)).toBe('25.00');
  });

  it('returns 0.00 when nothing has closed', () => {
    expect(computeWinRate(0, 0)).toBe('0.00');
    expect(computeLossRate(0, 0)).toBe('0.00');
  });
});

describe('computeAverageDealSize (pure)', () => {
  it('averages the amount across won opportunities', () => {
    const won = [{ amount: '1000.00' }, { amount: '2000.00' }] as never;
    expect(computeAverageDealSize(won)).toBe('1500.00');
  });

  it('returns 0.00 for no won opportunities', () => {
    expect(computeAverageDealSize([])).toBe('0.00');
  });
});

describe('computeAverageSalesCycleDays (pure)', () => {
  it('averages days between createdAt and closedAt', () => {
    const closed = [
      { createdAt: '2026-01-01T00:00:00.000Z', closedAt: '2026-01-11T00:00:00.000Z' },
      { createdAt: '2026-01-01T00:00:00.000Z', closedAt: '2026-01-21T00:00:00.000Z' },
    ] as never;
    expect(computeAverageSalesCycleDays(closed)).toBe('15.00');
  });

  it('returns 0.00 when nothing has a closedAt', () => {
    expect(computeAverageSalesCycleDays([{ createdAt: '2026-01-01T00:00:00.000Z' } as never])).toBe('0.00');
  });
});

describe('computePipelineValue (pure)', () => {
  it('sums amount across open opportunities', () => {
    const open = [{ amount: '500.00' }, { amount: '250.50' }] as never;
    expect(computePipelineValue(open)).toBe('750.50');
  });
});

describe('createPerformanceMetricsEngine', () => {
  function setup() {
    const repository = createSalesOpportunityRepository();
    const opportunities = createSalesOpportunityLifecycle(repository);
    const metrics = createPerformanceMetricsEngine(repository);
    return { repository, opportunities, metrics };
  }

  it('computes win rate, loss rate, average deal size, cycle, and pipeline value together', async () => {
    const { opportunities, metrics } = setup();

    const won = await opportunities.create(ORG, { name: 'Won deal', amount: '4000.00' });
    await opportunities.qualify(ORG, won.id);
    await opportunities.propose(ORG, won.id);
    await opportunities.negotiate(ORG, won.id);
    await opportunities.closeWon(ORG, won.id);

    const lost = await opportunities.create(ORG, { name: 'Lost deal', amount: '1000.00' });
    await opportunities.closeLost(ORG, lost.id);

    const open = await opportunities.create(ORG, { name: 'Open deal', amount: '2500.00' });
    await opportunities.qualify(ORG, open.id);

    const result = await metrics.getMetrics(ORG);
    expect(result.closedWonCount).toBe(1);
    expect(result.closedLostCount).toBe(1);
    expect(result.openCount).toBe(1);
    expect(result.winRate).toBe('50.00');
    expect(result.lossRate).toBe('50.00');
    expect(result.averageDealSize).toBe('4000.00');
    expect(result.pipelineValue).toBe('2500.00');
  });

  it('excludes archived opportunities from openCount and pipelineValue', async () => {
    const { opportunities, metrics } = setup();
    const opportunity = await opportunities.create(ORG, { name: 'Archived', amount: '999.00' });
    await opportunities.archive(ORG, opportunity.id);

    const result = await metrics.getMetrics(ORG);
    expect(result.openCount).toBe(0);
    expect(result.pipelineValue).toBe('0.00');
  });

  it('returns zeroed metrics for an organization with no opportunities', async () => {
    const { metrics } = setup();
    const result = await metrics.getMetrics(ORG);
    expect(result.winRate).toBe('0.00');
    expect(result.lossRate).toBe('0.00');
    expect(result.averageDealSize).toBe('0.00');
    expect(result.pipelineValue).toBe('0.00');
  });

  it('is organization-scoped', async () => {
    const { opportunities, metrics } = setup();
    await opportunities.create(ORG, { name: 'A', amount: '1000.00' });
    const result = await metrics.getMetrics('org-2');
    expect(result.openCount).toBe(0);
  });
});
