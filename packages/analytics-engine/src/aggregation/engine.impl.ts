/**
 * Real Aggregation Engine — deterministic group-by, filter, rollup,
 * drill-down, and comparison over arbitrary record arrays. Used to
 * aggregate data pulled from every integrated engine into a common
 * shape. The pure functions are generic over `<T>` so they can operate
 * directly on real sibling-package records; the stateful `aggregate()`
 * method persists a summarized snapshot over plain records.
 *
 * @module aggregation/engine.impl
 */
import type { AnalyticsEventBus } from '../events/analytics-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { AggregationResultRepository } from './repository.js';
import type { AggregationResult, DrillDownNode, GroupComparison } from './types.js';

/** Pure: groups records by the string returned from `keyFn`. */
export function groupBy<T>(records: readonly T[], keyFn: (record: T) => string): Readonly<Record<string, readonly T[]>> {
  const groups: Record<string, T[]> = {};
  for (const record of records) {
    const key = keyFn(record);
    (groups[key] ??= []).push(record);
  }
  return groups;
}

/** Pure: filters records by a predicate — a thin, explicit wrapper kept alongside `groupBy`/`rollup` for a uniform aggregation vocabulary. */
export function filterRecords<T>(records: readonly T[], predicate: (record: T) => boolean): readonly T[] {
  return records.filter(predicate);
}

/** Pure: sums `valueFn` per group, given an already-grouped record set. */
export function rollup<T>(groups: Readonly<Record<string, readonly T[]>>, valueFn: (record: T) => number): Readonly<Record<string, number>> {
  const totals: Record<string, number> = {};
  for (const [key, records] of Object.entries(groups)) {
    totals[key] = round2(records.reduce((sum, record) => sum + valueFn(record), 0));
  }
  return totals;
}

/** Pure: recursively groups records by a sequence of key functions, one level per function. */
export function drillDown<T>(records: readonly T[], keyFns: readonly ((record: T) => string)[]): DrillDownNode<T> | readonly T[] {
  if (keyFns.length === 0) return records;
  const [keyFn, ...rest] = keyFns;
  const grouped = groupBy(records, keyFn!);
  const node: Record<string, DrillDownNode<T> | readonly T[]> = {};
  for (const [key, groupRecords] of Object.entries(grouped)) {
    node[key] = drillDown(groupRecords, rest);
  }
  return node;
}

/** Pure: compares two group-total maps, computing the percentage change per group key present in either. */
export function compareGroups(current: Readonly<Record<string, number>>, previous: Readonly<Record<string, number>>): Readonly<Record<string, GroupComparison>> {
  const keys = new Set([...Object.keys(current), ...Object.keys(previous)]);
  const comparisons: Record<string, GroupComparison> = {};
  for (const key of keys) {
    const currentValue = current[key] ?? 0;
    const previousValue = previous[key] ?? 0;
    comparisons[key] = {
      current: currentValue,
      previous: previousValue,
      changePercentage: previousValue === 0 ? 0 : round2(((currentValue - previousValue) / previousValue) * 100),
    };
  }
  return comparisons;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface AggregateInput<T> {
  readonly records: readonly T[];
  readonly groupByKey: string;
  readonly groupFn: (record: T) => string;
  readonly valueFn: (record: T) => number;
  readonly filter?: (record: T) => boolean;
}

export interface AggregationEngine {
  aggregate<T>(organizationId: OrganizationId, input: AggregateInput<T>): Promise<AggregationResult>;
  get(organizationId: OrganizationId, aggregationResultId: string): Promise<AggregationResult | null>;
  list(organizationId: OrganizationId): Promise<readonly AggregationResult[]>;
}

/** Creates a real {@link AggregationEngine} backed by an {@link AggregationResultRepository}. */
export function createAggregationEngine(
  repository: AggregationResultRepository,
  eventBus?: AnalyticsEventBus,
  now: () => string = nowIso,
): AggregationEngine {
  return {
    async aggregate<T>(organizationId: OrganizationId, input: AggregateInput<T>) {
      const filtered = input.filter ? filterRecords(input.records, input.filter) : input.records;
      const groups = groupBy(filtered, input.groupFn);
      const groupTotals = rollup(groups, input.valueFn);
      const groupCounts: Record<string, number> = {};
      for (const [key, records] of Object.entries(groups)) groupCounts[key] = records.length;

      const timestamp = now();
      const result: AggregationResult = {
        id: generateId('aggregation-result'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        groupByKey: input.groupByKey,
        groupTotals,
        groupCounts,
        computedAt: timestamp,
      };
      await repository.save(result);
      eventBus?.publish('aggregation.completed', { organizationId, aggregationResultId: result.id, groupCount: Object.keys(groupTotals).length });
      return result;
    },

    async get(organizationId, aggregationResultId) {
      return repository.findById(organizationId, aggregationResultId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
