import { describe, expect, it } from 'vitest';
import { generateId, nowIso } from '../src/shared/id.js';
import {
  DashboardNotFoundError,
  KpiSnapshotNotFoundError,
  MetricSnapshotNotFoundError,
  AnalyticsReportNotFoundError,
} from '../src/shared/errors.js';

describe('generateId (pure)', () => {
  it('prefixes the id with the given string', () => {
    expect(generateId('kpi-snapshot')).toMatch(/^kpi-snapshot-/);
  });

  it('generates unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('x')));
    expect(ids.size).toBe(50);
  });
});

describe('nowIso (pure)', () => {
  it('returns a valid ISO 8601 date-time string', () => {
    const value = nowIso();
    expect(new Date(value).toISOString()).toBe(value);
  });
});

describe('typed errors', () => {
  it('DashboardNotFoundError carries the dashboard id', () => {
    expect(new DashboardNotFoundError('dash-1').dashboardId).toBe('dash-1');
  });

  it('KpiSnapshotNotFoundError carries the snapshot id', () => {
    expect(new KpiSnapshotNotFoundError('kpi-1').kpiSnapshotId).toBe('kpi-1');
  });

  it('MetricSnapshotNotFoundError carries the snapshot id', () => {
    expect(new MetricSnapshotNotFoundError('metric-1').metricSnapshotId).toBe('metric-1');
  });

  it('AnalyticsReportNotFoundError carries the report id', () => {
    expect(new AnalyticsReportNotFoundError('report-1').reportId).toBe('report-1');
  });
});
