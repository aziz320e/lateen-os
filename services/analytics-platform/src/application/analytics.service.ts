import { randomUUID } from 'node:crypto';
import type {
  AnalyticsPipelineResult,
  AnalyticsRequest,
  DashboardData,
  DashboardId,
  ExportFormat,
  ExportJob,
} from '../domain/types.js';
import { AnalyticsPipeline } from '../pipeline/analytics-pipeline.js';
import type { SourceCollectorRegistry } from '../collectors/source-collector.js';
import type { AnalyticsRepositoryPort } from '../repositories/in-memory-repository.js';
import { DASHBOARD_IDS } from '../domain/types.js';

export class AnalyticsService {
  private readonly pipeline: AnalyticsPipeline;

  constructor(
    registry: SourceCollectorRegistry,
    private readonly repo: AnalyticsRepositoryPort,
  ) {
    this.pipeline = new AnalyticsPipeline(registry);
  }

  async runAnalytics(request: AnalyticsRequest): Promise<AnalyticsPipelineResult> {
    return this.pipeline.execute(request);
  }

  async getDashboard(dashboardId: DashboardId, organizationId: string): Promise<DashboardData | undefined> {
    const result = await this.pipeline.execute({ organizationId, dashboardId });
    return result.dashboard;
  }

  async listDashboards() {
    return DASHBOARD_IDS.map((id) => ({ id, name: id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }));
  }

  async getMetrics(request: AnalyticsRequest) {
    const result = await this.pipeline.execute(request);
    return result.metrics;
  }

  async listReports() {
    return this.repo.listReports();
  }

  async listAlerts() {
    return this.repo.listAlerts();
  }

  async createExport(organizationId: string, format: ExportFormat, dashboardId?: DashboardId): Promise<ExportJob> {
    const job: ExportJob = {
      id: randomUUID(),
      format,
      dashboardId,
      status: 'completed',
      downloadUrl: `/exports/${randomUUID()}.${format === 'excel' ? 'xlsx' : format}`,
      createdAt: new Date().toISOString(),
    };
    return this.repo.saveExport(job);
  }

  async listExports(organizationId: string) {
    return this.repo.listExports(organizationId);
  }
}
