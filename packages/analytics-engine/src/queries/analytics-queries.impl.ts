/**
 * Real {@link AnalyticsQueries} implementation — a CQRS read layer
 * composed over the Analytics Platform repositories. Repositories are
 * taken as constructor dependencies but never returned to callers.
 *
 * Note: Governance Analytics and Communication Analytics snapshots are
 * deliberately not exposed through this query layer (the fixed 11-query
 * list does not include `findGovernanceAnalytics` / `findCommunicationAnalytics`)
 * — they remain accessible via `runtime.governanceAnalytics` /
 * `runtime.communicationAnalytics` directly, and their records are
 * still reachable generically via `searchAnalytics`.
 *
 * @module queries/analytics-queries.impl
 */
import type { DashboardRepository } from '../dashboard/repository.js';
import type { KpiSnapshotRepository } from '../kpi/repository.js';
import type { MetricSnapshotRepository } from '../metrics/repository.js';
import type { AnalyticsReportRepository } from '../report/repository.js';
import type { RevenueAnalyticsRepository } from '../revenue-analytics/repository.js';
import type { MarketingAnalyticsRepository } from '../marketing-analytics/repository.js';
import type { SalesAnalyticsRepository } from '../sales-analytics/repository.js';
import type { WorkflowAnalyticsRepository } from '../workflow-analytics/repository.js';
import type { SecurityAnalyticsRepository } from '../security-analytics/repository.js';
import type { ComplianceAnalyticsRepository } from '../compliance-analytics/repository.js';
import type { AnalyticsQueries } from './analytics-queries.js';
import type {
  FindComplianceAnalyticsQuery,
  FindComplianceAnalyticsResult,
  FindDashboardsQuery,
  FindDashboardsResult,
  FindKPIsQuery,
  FindKPIsResult,
  FindMarketingAnalyticsQuery,
  FindMarketingAnalyticsResult,
  FindMetricsQuery,
  FindMetricsResult,
  FindReportsQuery,
  FindReportsResult,
  FindRevenueAnalyticsQuery,
  FindRevenueAnalyticsResult,
  FindSalesAnalyticsQuery,
  FindSalesAnalyticsResult,
  FindSecurityAnalyticsQuery,
  FindSecurityAnalyticsResult,
  FindWorkflowAnalyticsQuery,
  FindWorkflowAnalyticsResult,
  SearchAnalyticsMatch,
  SearchAnalyticsQuery,
  SearchAnalyticsResult,
} from './types.js';

export interface AnalyticsQueriesDeps {
  readonly dashboardRepository: DashboardRepository;
  readonly kpiSnapshotRepository: KpiSnapshotRepository;
  readonly metricSnapshotRepository: MetricSnapshotRepository;
  readonly reportRepository: AnalyticsReportRepository;
  readonly revenueAnalyticsRepository: RevenueAnalyticsRepository;
  readonly marketingAnalyticsRepository: MarketingAnalyticsRepository;
  readonly salesAnalyticsRepository: SalesAnalyticsRepository;
  readonly workflowAnalyticsRepository: WorkflowAnalyticsRepository;
  readonly securityAnalyticsRepository: SecurityAnalyticsRepository;
  readonly complianceAnalyticsRepository: ComplianceAnalyticsRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}

/** Creates a real {@link AnalyticsQueries} read port over the given repositories. */
export function createAnalyticsQueries(deps: AnalyticsQueriesDeps): AnalyticsQueries {
  return {
    async findDashboards(query: FindDashboardsQuery): Promise<FindDashboardsResult> {
      const dashboards = query.dashboardType
        ? await deps.dashboardRepository.findByType(query.organizationId, query.dashboardType)
        : await deps.dashboardRepository.findAll(query.organizationId);
      return { dashboards: paginate(dashboards, query.offset, query.limit), total: dashboards.length };
    },

    async findKPIs(query: FindKPIsQuery): Promise<FindKPIsResult> {
      const kpis = query.kpiType
        ? await deps.kpiSnapshotRepository.findByType(query.organizationId, query.kpiType)
        : await deps.kpiSnapshotRepository.findAll(query.organizationId);
      return { kpis: paginate(kpis, query.offset, query.limit), total: kpis.length };
    },

    async findMetrics(query: FindMetricsQuery): Promise<FindMetricsResult> {
      let metrics = query.metricName
        ? await deps.metricSnapshotRepository.findByName(query.organizationId, query.metricName)
        : await deps.metricSnapshotRepository.findAll(query.organizationId);
      if (query.metricType) metrics = metrics.filter((metric) => metric.metricType === query.metricType);
      return { metrics: paginate(metrics, query.offset, query.limit), total: metrics.length };
    },

    async findReports(query: FindReportsQuery): Promise<FindReportsResult> {
      const reports = query.format
        ? await deps.reportRepository.findByFormat(query.organizationId, query.format)
        : await deps.reportRepository.findAll(query.organizationId);
      return { reports: paginate(reports, query.offset, query.limit), total: reports.length };
    },

    async findRevenueAnalytics(query: FindRevenueAnalyticsQuery): Promise<FindRevenueAnalyticsResult> {
      const snapshots = await deps.revenueAnalyticsRepository.findAll(query.organizationId);
      return { snapshots: paginate(snapshots, query.offset, query.limit), total: snapshots.length };
    },

    async findMarketingAnalytics(query: FindMarketingAnalyticsQuery): Promise<FindMarketingAnalyticsResult> {
      const snapshots = await deps.marketingAnalyticsRepository.findAll(query.organizationId);
      return { snapshots: paginate(snapshots, query.offset, query.limit), total: snapshots.length };
    },

    async findSalesAnalytics(query: FindSalesAnalyticsQuery): Promise<FindSalesAnalyticsResult> {
      const snapshots = await deps.salesAnalyticsRepository.findAll(query.organizationId);
      return { snapshots: paginate(snapshots, query.offset, query.limit), total: snapshots.length };
    },

    async findWorkflowAnalytics(query: FindWorkflowAnalyticsQuery): Promise<FindWorkflowAnalyticsResult> {
      const snapshots = await deps.workflowAnalyticsRepository.findAll(query.organizationId);
      return { snapshots: paginate(snapshots, query.offset, query.limit), total: snapshots.length };
    },

    async findSecurityAnalytics(query: FindSecurityAnalyticsQuery): Promise<FindSecurityAnalyticsResult> {
      const snapshots = await deps.securityAnalyticsRepository.findAll(query.organizationId);
      return { snapshots: paginate(snapshots, query.offset, query.limit), total: snapshots.length };
    },

    async findComplianceAnalytics(query: FindComplianceAnalyticsQuery): Promise<FindComplianceAnalyticsResult> {
      const snapshots = await deps.complianceAnalyticsRepository.findAll(query.organizationId);
      return { snapshots: paginate(snapshots, query.offset, query.limit), total: snapshots.length };
    },

    async searchAnalytics(query: SearchAnalyticsQuery): Promise<SearchAnalyticsResult> {
      const [dashboards, kpis, metrics, reports] = await Promise.all([
        deps.dashboardRepository.findAll(query.organizationId),
        deps.kpiSnapshotRepository.findAll(query.organizationId),
        deps.metricSnapshotRepository.findAll(query.organizationId),
        deps.reportRepository.findAll(query.organizationId),
      ]);

      const matches: SearchAnalyticsMatch[] = [];
      for (const dashboard of dashboards) {
        const score = scoreLabel(dashboard.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'dashboard', id: dashboard.id, label: dashboard.name, score });
      }
      for (const kpi of kpis) {
        const score = scoreLabel(kpi.kpiType, query.keyword);
        if (score > 0) matches.push({ recordType: 'kpi', id: kpi.id, label: kpi.kpiType, score });
      }
      for (const metric of metrics) {
        const score = scoreLabel(metric.metricName, query.keyword);
        if (score > 0) matches.push({ recordType: 'metric', id: metric.id, label: metric.metricName, score });
      }
      for (const report of reports) {
        const score = scoreLabel(report.title, query.keyword);
        if (score > 0) matches.push({ recordType: 'report', id: report.id, label: report.title, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      const limited = query.limit === undefined ? matches : matches.slice(0, query.limit);
      return { matches: limited, total: matches.length };
    },
  };
}
