import type { AnalyticsDomain, MetricSnapshot } from '../domain/types.js';

export interface SourceCollectorPort {
  readonly domain: AnalyticsDomain;
  collect(organizationId: string): Promise<readonly RawDataPoint[]>;
}

export interface RawDataPoint {
  readonly source: string;
  readonly metric: string;
  readonly value: number;
  readonly timestamp: string;
}

export interface SourceCollectorRegistry {
  register(collector: SourceCollectorPort): void;
  list(): readonly SourceCollectorPort[];
  get(domain: AnalyticsDomain): SourceCollectorPort | undefined;
}

export class InMemorySourceCollectorRegistry implements SourceCollectorRegistry {
  private readonly collectors = new Map<AnalyticsDomain, SourceCollectorPort>();

  register(collector: SourceCollectorPort): void {
    this.collectors.set(collector.domain, collector);
  }

  list(): readonly SourceCollectorPort[] {
    return [...this.collectors.values()];
  }

  get(domain: AnalyticsDomain): SourceCollectorPort | undefined {
    return this.collectors.get(domain);
  }
}

export interface NormalizedDataPoint {
  readonly domain: AnalyticsDomain;
  readonly metric: string;
  readonly value: number;
  readonly timestamp: string;
}

export function normalizeDataPoints(
  raw: readonly RawDataPoint[],
  domain: AnalyticsDomain,
): NormalizedDataPoint[] {
  return raw.map((r) => ({
    domain,
    metric: r.metric,
    value: r.value,
    timestamp: r.timestamp,
  }));
}

export function aggregateByMetric(points: readonly NormalizedDataPoint[]): Map<string, number> {
  const totals = new Map<string, { sum: number; count: number }>();
  for (const p of points) {
    const existing = totals.get(p.metric) ?? { sum: 0, count: 0 };
    totals.set(p.metric, { sum: existing.sum + p.value, count: existing.count + 1 });
  }
  const result = new Map<string, number>();
  for (const [metric, { sum, count }] of totals) {
    result.set(metric, sum / count);
  }
  return result;
}

export function toMetricSnapshots(
  aggregated: Map<string, number>,
  domain: AnalyticsDomain,
): MetricSnapshot[] {
  const now = new Date().toISOString();
  return [...aggregated.entries()].map(([metric, value]) => ({
    id: metric as MetricSnapshot['id'],
    domain,
    value,
    unit: metric.includes('cost') || metric.includes('revenue') ? 'USD' : metric.includes('rate') ? '%' : 'count',
    timestamp: now,
  }));
}
