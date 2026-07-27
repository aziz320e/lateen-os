/** Typed errors used consistently across the Analytics Platform runtime implementations. @module shared/errors */

export class DashboardNotFoundError extends Error {
  constructor(readonly dashboardId: string) {
    super(`Dashboard "${dashboardId}" not found`);
    this.name = 'DashboardNotFoundError';
  }
}

export class KpiSnapshotNotFoundError extends Error {
  constructor(readonly kpiSnapshotId: string) {
    super(`KPI snapshot "${kpiSnapshotId}" not found`);
    this.name = 'KpiSnapshotNotFoundError';
  }
}

export class MetricSnapshotNotFoundError extends Error {
  constructor(readonly metricSnapshotId: string) {
    super(`Metric snapshot "${metricSnapshotId}" not found`);
    this.name = 'MetricSnapshotNotFoundError';
  }
}

export class AnalyticsReportNotFoundError extends Error {
  constructor(readonly reportId: string) {
    super(`Analytics report "${reportId}" not found`);
    this.name = 'AnalyticsReportNotFoundError';
  }
}
