/**
 * Real Trend Engine — deterministic day/week/month/quarter/year
 * bucketing and trend direction over a set of timestamped
 * observations. No AI model — bucketing is fixed calendar arithmetic
 * (ISO week numbering for `week`).
 *
 * @module trend/engine.impl
 */
import type { AnalyticsEventBus } from '../events/analytics-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { TrendResultRepository } from './repository.js';
import type { TrendBucket, TrendDataPoint, TrendDirection, TrendGranularity, TrendResult } from './types.js';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Pure: the ISO-8601 week key (`YYYY-Www`) for a date. */
export function isoWeekKey(date: Date): string {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (utc.getUTCDay() + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(utc.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const weekNumber = 1 + Math.round((utc.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${utc.getUTCFullYear()}-W${pad2(weekNumber)}`;
}

/** Pure: the deterministic bucket key for a timestamp at the given granularity. */
export function bucketKeyForGranularity(timestamp: string, granularity: TrendGranularity): string {
  const date = new Date(timestamp);
  switch (granularity) {
    case 'day':
      return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
    case 'week':
      return isoWeekKey(date);
    case 'month':
      return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
    case 'quarter':
      return `${date.getUTCFullYear()}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
    case 'year':
      return `${date.getUTCFullYear()}`;
  }
}

/** Pure: groups data points into sorted, deterministic buckets for the given granularity. */
export function computeTrendBuckets(points: readonly TrendDataPoint[], granularity: TrendGranularity): readonly TrendBucket[] {
  const totals = new Map<string, { total: number; count: number }>();
  for (const point of points) {
    const key = bucketKeyForGranularity(point.timestamp, granularity);
    const existing = totals.get(key) ?? { total: 0, count: 0 };
    totals.set(key, { total: existing.total + point.value, count: existing.count + 1 });
  }
  return [...totals.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([period, { total, count }]) => ({ period, total: round2(total), average: round2(total / count), count }));
}

/** Pure: trend direction and percentage change comparing the first and last buckets. */
export function computeTrendDirection(buckets: readonly TrendBucket[]): { direction: TrendDirection; changePercentage: number } {
  if (buckets.length < 2) return { direction: 'flat', changePercentage: 0 };
  const first = buckets[0]!.total;
  const last = buckets[buckets.length - 1]!.total;
  if (first === last) return { direction: 'flat', changePercentage: 0 };
  const changePercentage = first === 0 ? 0 : round2(((last - first) / first) * 100);
  return { direction: last > first ? 'up' : 'down', changePercentage };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface ComputeTrendInput {
  readonly granularity: TrendGranularity;
  readonly points: readonly TrendDataPoint[];
}

export interface TrendEngine {
  computeTrend(organizationId: OrganizationId, input: ComputeTrendInput): Promise<TrendResult>;
  get(organizationId: OrganizationId, trendResultId: string): Promise<TrendResult | null>;
  list(organizationId: OrganizationId): Promise<readonly TrendResult[]>;
}

/** Creates a real {@link TrendEngine} backed by a {@link TrendResultRepository}. */
export function createTrendEngine(
  repository: TrendResultRepository,
  eventBus?: AnalyticsEventBus,
  now: () => string = nowIso,
): TrendEngine {
  return {
    async computeTrend(organizationId, input) {
      const buckets = computeTrendBuckets(input.points, input.granularity);
      const { direction, changePercentage } = computeTrendDirection(buckets);
      const timestamp = now();
      const result: TrendResult = {
        id: generateId('trend-result'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        granularity: input.granularity,
        buckets,
        direction,
        changePercentage,
        computedAt: timestamp,
      };
      await repository.save(result);
      eventBus?.publish('trend.updated', { organizationId, trendResultId: result.id, granularity: result.granularity });
      return result;
    },

    async get(organizationId, trendResultId) {
      return repository.findById(organizationId, trendResultId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
