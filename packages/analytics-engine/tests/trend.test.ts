import { describe, expect, it } from 'vitest';
import { createTrendResultRepository } from '../src/trend/repository.impl.js';
import {
  bucketKeyForGranularity,
  computeTrendBuckets,
  computeTrendDirection,
  createTrendEngine,
  isoWeekKey,
} from '../src/trend/engine.impl.js';
import { createAnalyticsEventBus } from '../src/events/index.js';

const ORG = 'org-1';

describe('bucketKeyForGranularity (pure)', () => {
  it('buckets by day', () => {
    expect(bucketKeyForGranularity('2026-03-15T10:00:00.000Z', 'day')).toBe('2026-03-15');
  });

  it('buckets by month', () => {
    expect(bucketKeyForGranularity('2026-03-15T10:00:00.000Z', 'month')).toBe('2026-03');
  });

  it('buckets by quarter', () => {
    expect(bucketKeyForGranularity('2026-01-15T00:00:00.000Z', 'quarter')).toBe('2026-Q1');
    expect(bucketKeyForGranularity('2026-04-01T00:00:00.000Z', 'quarter')).toBe('2026-Q2');
    expect(bucketKeyForGranularity('2026-12-31T00:00:00.000Z', 'quarter')).toBe('2026-Q4');
  });

  it('buckets by year', () => {
    expect(bucketKeyForGranularity('2026-03-15T00:00:00.000Z', 'year')).toBe('2026');
  });

  it('buckets by ISO week', () => {
    expect(bucketKeyForGranularity('2026-01-01T00:00:00.000Z', 'week')).toBe(isoWeekKey(new Date('2026-01-01T00:00:00.000Z')));
  });
});

describe('isoWeekKey (pure)', () => {
  it('returns a YYYY-Www formatted key', () => {
    expect(isoWeekKey(new Date('2026-06-15T00:00:00.000Z'))).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe('computeTrendBuckets (pure)', () => {
  it('groups and sums values per bucket, sorted ascending', () => {
    const buckets = computeTrendBuckets(
      [
        { timestamp: '2026-02-01T00:00:00.000Z', value: 10 },
        { timestamp: '2026-01-01T00:00:00.000Z', value: 5 },
        { timestamp: '2026-01-15T00:00:00.000Z', value: 15 },
      ],
      'month',
    );
    expect(buckets).toEqual([
      { period: '2026-01', total: 20, average: 10, count: 2 },
      { period: '2026-02', total: 10, average: 10, count: 1 },
    ]);
  });

  it('returns an empty array for no points', () => {
    expect(computeTrendBuckets([], 'day')).toEqual([]);
  });
});

describe('computeTrendDirection (pure)', () => {
  it('returns flat for fewer than two buckets', () => {
    expect(computeTrendDirection([{ period: 'a', total: 10, average: 10, count: 1 }])).toEqual({ direction: 'flat', changePercentage: 0 });
  });

  it('returns up when the last bucket total exceeds the first', () => {
    const result = computeTrendDirection([
      { period: 'a', total: 100, average: 100, count: 1 },
      { period: 'b', total: 150, average: 150, count: 1 },
    ]);
    expect(result).toEqual({ direction: 'up', changePercentage: 50 });
  });

  it('returns down when the last bucket total is lower', () => {
    const result = computeTrendDirection([
      { period: 'a', total: 100, average: 100, count: 1 },
      { period: 'b', total: 50, average: 50, count: 1 },
    ]);
    expect(result.direction).toBe('down');
  });

  it('returns flat when first and last totals are equal', () => {
    const result = computeTrendDirection([
      { period: 'a', total: 100, average: 100, count: 1 },
      { period: 'b', total: 100, average: 100, count: 1 },
    ]);
    expect(result).toEqual({ direction: 'flat', changePercentage: 0 });
  });
});

function setup(eventBus = createAnalyticsEventBus()) {
  const repository = createTrendResultRepository();
  const engine = createTrendEngine(repository, eventBus);
  return { repository, engine, eventBus };
}

describe('createTrendEngine — computeTrend', () => {
  it('persists a trend result with buckets and direction', async () => {
    const { engine } = setup();
    const result = await engine.computeTrend(ORG, {
      granularity: 'month',
      points: [
        { timestamp: '2026-01-01T00:00:00.000Z', value: 100 },
        { timestamp: '2026-02-01T00:00:00.000Z', value: 200 },
      ],
    });
    expect(result.direction).toBe('up');
    expect(result.buckets).toHaveLength(2);
  });

  it('supports all five granularities', async () => {
    const { engine } = setup();
    const granularities = ['day', 'week', 'month', 'quarter', 'year'] as const;
    for (const granularity of granularities) {
      const result = await engine.computeTrend(ORG, { granularity, points: [{ timestamp: '2026-01-01T00:00:00.000Z', value: 1 }] });
      expect(result.granularity).toBe(granularity);
    }
  });

  it('publishes trend.updated', async () => {
    const eventBus = createAnalyticsEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('trend.updated', (payload) => (seen = payload));
    const result = await engine.computeTrend(ORG, { granularity: 'day', points: [] });
    expect(seen).toEqual({ organizationId: ORG, trendResultId: result.id, granularity: 'day' });
  });
});

describe('createTrendEngine — get / list / org scoping', () => {
  it('get() returns null for an unknown result', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every computed trend', async () => {
    const { engine } = setup();
    await engine.computeTrend(ORG, { granularity: 'day', points: [] });
    await engine.computeTrend(ORG, { granularity: 'month', points: [] });
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const result = await engine.computeTrend(ORG, { granularity: 'day', points: [] });
    expect(await repository.findById('org-2', result.id)).toBeNull();
  });
});
