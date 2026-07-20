import type {
  AlertDefinition,
  DashboardId,
  ExportFormat,
  ExportJob,
  ReportDefinition,
  ReportPeriod,
} from '../domain/types.js';
import { DASHBOARD_IDS, METRIC_IDS } from '../domain/types.js';

export interface AnalyticsRepositoryPort {
  listReports(): Promise<readonly ReportDefinition[]>;
  listAlerts(): Promise<readonly AlertDefinition[]>;
  saveExport(job: ExportJob): Promise<ExportJob>;
  listExports(organizationId: string): Promise<readonly ExportJob[]>;
}

export class InMemoryAnalyticsRepository implements AnalyticsRepositoryPort {
  private exports: ExportJob[] = [];

  async listReports(): Promise<readonly ReportDefinition[]> {
    const periods: ReportPeriod[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    return periods.map((period, i) => ({
      id: `report-${period}`,
      name: `${period.charAt(0).toUpperCase() + period.slice(1)} Report`,
      period,
      domain: 'executive' as const,
      metrics: METRIC_IDS.slice(i * 3, i * 3 + 3),
    }));
  }

  async listAlerts(): Promise<readonly AlertDefinition[]> {
    return [
      { id: 'alert-1', type: 'threshold', metricId: 'ai-cost', threshold: 2000, message: 'AI cost exceeds budget', status: 'active' },
      { id: 'alert-2', type: 'kpi', metricId: 'workflow-success', threshold: 0.9, message: 'Workflow success below SLA', status: 'triggered' },
      { id: 'alert-3', type: 'trend', metricId: 'revenue', message: 'Revenue trend declining', status: 'active' },
      { id: 'alert-4', type: 'anomaly', metricId: 'search-usage', message: 'Anomaly detected in search usage (contract)', status: 'active' },
      { id: 'alert-5', type: 'sla', metricId: 'connector-health', threshold: 0.95, message: 'Connector health SLA breach', status: 'resolved' },
    ];
  }

  async saveExport(job: ExportJob): Promise<ExportJob> {
    this.exports.push(job);
    return job;
  }

  async listExports(organizationId: string): Promise<readonly ExportJob[]> {
    return this.exports;
  }
}

export function dashboardName(id: DashboardId): string {
  return id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export { DASHBOARD_IDS };
