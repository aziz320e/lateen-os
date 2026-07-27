import { describe, expect, it } from 'vitest';
import { createAggregationResultRepository } from '../src/aggregation/repository.impl.js';
import { compareGroups, createAggregationEngine, drillDown, filterRecords, groupBy, rollup } from '../src/aggregation/engine.impl.js';
import { createAnalyticsEventBus } from '../src/events/index.js';

const ORG = 'org-1';

interface Deal {
  readonly stage: string;
  readonly region: string;
  readonly amount: number;
}

const deals: Deal[] = [
  { stage: 'won', region: 'us', amount: 100 },
  { stage: 'won', region: 'eu', amount: 200 },
  { stage: 'lost', region: 'us', amount: 50 },
];

describe('groupBy (pure)', () => {
  it('groups records by the key function', () => {
    const groups = groupBy(deals, (d) => d.stage);
    expect(groups.won).toHaveLength(2);
    expect(groups.lost).toHaveLength(1);
  });

  it('returns an empty object for an empty array', () => {
    expect(groupBy([], (d: Deal) => d.stage)).toEqual({});
  });
});

describe('filterRecords (pure)', () => {
  it('filters records by a predicate', () => {
    const won = filterRecords(deals, (d) => d.stage === 'won');
    expect(won).toHaveLength(2);
  });
});

describe('rollup (pure)', () => {
  it('sums the value function per group', () => {
    const groups = groupBy(deals, (d) => d.stage);
    const totals = rollup(groups, (d) => d.amount);
    expect(totals).toEqual({ won: 300, lost: 50 });
  });
});

describe('drillDown (pure)', () => {
  it('recursively groups by a sequence of key functions', () => {
    const tree = drillDown(deals, [(d: Deal) => d.stage, (d: Deal) => d.region]);
    expect(tree).toEqual({
      won: { us: [deals[0]], eu: [deals[1]] },
      lost: { us: [deals[2]] },
    });
  });

  it('returns the flat record array when given no key functions', () => {
    expect(drillDown(deals, [])).toBe(deals);
  });
});

describe('compareGroups (pure)', () => {
  it('computes percentage change per group', () => {
    const result = compareGroups({ a: 150 }, { a: 100 });
    expect(result.a).toEqual({ current: 150, previous: 100, changePercentage: 50 });
  });

  it('treats a missing group as 0', () => {
    const result = compareGroups({ b: 50 }, { a: 100 });
    expect(result.a).toEqual({ current: 0, previous: 100, changePercentage: -100 });
    expect(result.b).toEqual({ current: 50, previous: 0, changePercentage: 0 });
  });
});

function setup(eventBus = createAnalyticsEventBus()) {
  const repository = createAggregationResultRepository();
  const engine = createAggregationEngine(repository, eventBus);
  return { repository, engine, eventBus };
}

describe('createAggregationEngine — aggregate', () => {
  it('groups, filters, and rolls up records into a persisted result', async () => {
    const { engine } = setup();
    const result = await engine.aggregate(ORG, {
      records: deals,
      groupByKey: 'stage',
      groupFn: (d: Deal) => d.stage,
      valueFn: (d: Deal) => d.amount,
    });
    expect(result.groupTotals).toEqual({ won: 300, lost: 50 });
    expect(result.groupCounts).toEqual({ won: 2, lost: 1 });
  });

  it('applies an optional filter before grouping', async () => {
    const { engine } = setup();
    const result = await engine.aggregate(ORG, {
      records: deals,
      groupByKey: 'stage',
      groupFn: (d: Deal) => d.stage,
      valueFn: (d: Deal) => d.amount,
      filter: (d: Deal) => d.region === 'us',
    });
    expect(result.groupTotals).toEqual({ won: 100, lost: 50 });
  });

  it('publishes aggregation.completed with the group count', async () => {
    const eventBus = createAnalyticsEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('aggregation.completed', (payload) => (seen = payload));
    const result = await engine.aggregate(ORG, { records: deals, groupByKey: 'stage', groupFn: (d: Deal) => d.stage, valueFn: (d: Deal) => d.amount });
    expect(seen).toEqual({ organizationId: ORG, aggregationResultId: result.id, groupCount: 2 });
  });
});

describe('createAggregationEngine — get / list / org scoping', () => {
  it('get() returns null for an unknown result', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every aggregation run', async () => {
    const { engine } = setup();
    await engine.aggregate(ORG, { records: deals, groupByKey: 'stage', groupFn: (d: Deal) => d.stage, valueFn: (d: Deal) => d.amount });
    await engine.aggregate(ORG, { records: deals, groupByKey: 'region', groupFn: (d: Deal) => d.region, valueFn: (d: Deal) => d.amount });
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const result = await engine.aggregate(ORG, { records: deals, groupByKey: 'stage', groupFn: (d: Deal) => d.stage, valueFn: (d: Deal) => d.amount });
    expect(await repository.findById('org-2', result.id)).toBeNull();
  });
});
