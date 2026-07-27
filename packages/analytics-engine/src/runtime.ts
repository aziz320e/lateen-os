/**
 * Analytics Runtime — the package's composition root. Wires every
 * real in-memory repository and service together: the KPI Engine, the
 * Metrics Engine, the Executive Dashboard, the Trend Engine, the
 * Aggregation Engine, the 8 category analytics engines (revenue,
 * sales, marketing, communication, workflow, security, governance,
 * compliance — each composed with its own real sibling package query
 * port), the Report Engine, the Relationship Layer (Institutional
 * Memory, Domain Graph, Decision Engine, Intelligence Engine, AI
 * Workforce, Business DNA), the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link AnalyticsRuntime} surface.
 *
 * @module runtime
 */
import { createAggregationEngine, createAggregationResultRepository, type AggregationEngine } from './aggregation/index.js';
import { createCommunicationAnalyticsEngine, createCommunicationAnalyticsRepository, type CommunicationAnalyticsDeps, type CommunicationAnalyticsEngine } from './communication-analytics/index.js';
import { createComplianceAnalyticsEngine, createComplianceAnalyticsRepository, type ComplianceAnalyticsDeps, type ComplianceAnalyticsEngine } from './compliance-analytics/index.js';
import { createDashboardEngine, createDashboardRepository, type DashboardEngine } from './dashboard/index.js';
import { createAnalyticsEventBus, type AnalyticsEventBus } from './events/index.js';
import { createGovernanceAnalyticsEngine, createGovernanceAnalyticsRepository, type GovernanceAnalyticsDeps, type GovernanceAnalyticsEngine } from './governance-analytics/index.js';
import { createKpiEngine, createKpiSnapshotRepository, type KpiEngine } from './kpi/index.js';
import { createMarketingAnalyticsEngine, createMarketingAnalyticsRepository, type MarketingAnalyticsDeps, type MarketingAnalyticsEngine } from './marketing-analytics/index.js';
import { createMetricsEngine, createMetricSnapshotRepository, type MetricsEngine } from './metrics/index.js';
import { createAnalyticsQueries, type AnalyticsQueries } from './queries/index.js';
import { createRelationshipManagement, type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';
import { createAnalyticsReportRepository, createReportEngine, type ReportEngine } from './report/index.js';
import { createRevenueAnalyticsEngine, createRevenueAnalyticsRepository, type RevenueAnalyticsDeps, type RevenueAnalyticsEngine } from './revenue-analytics/index.js';
import { createSalesAnalyticsEngine, createSalesAnalyticsRepository, type SalesAnalyticsDeps, type SalesAnalyticsEngine } from './sales-analytics/index.js';
import { createSecurityAnalyticsEngine, createSecurityAnalyticsRepository, type SecurityAnalyticsDeps, type SecurityAnalyticsEngine } from './security-analytics/index.js';
import { nowIso } from './shared/id.js';
import { createTrendEngine, createTrendResultRepository, type TrendEngine } from './trend/index.js';
import { createWorkflowAnalyticsEngine, createWorkflowAnalyticsRepository, type WorkflowAnalyticsDeps, type WorkflowAnalyticsEngine } from './workflow-analytics/index.js';

export interface AnalyticsRuntimeDeps {
  readonly eventBus?: AnalyticsEventBus;
  readonly now?: () => string;
  readonly sales?: RevenueAnalyticsDeps['sales'];
  readonly crm?: RevenueAnalyticsDeps['crm'];
  readonly marketing?: MarketingAnalyticsDeps['marketing'];
  readonly communicationHub?: CommunicationAnalyticsDeps['communicationHub'];
  readonly workflow?: WorkflowAnalyticsDeps['workflow'];
  readonly aiSecurity?: SecurityAnalyticsDeps['aiSecurity'];
  readonly aiGovernance?: GovernanceAnalyticsDeps['aiGovernance'];
  readonly aiCompliance?: ComplianceAnalyticsDeps['aiCompliance'];
  readonly institutionalMemory?: RelationshipManagementDeps['institutionalMemory'];
  readonly domainGraph?: RelationshipManagementDeps['domainGraph'];
  readonly decisionEngine?: RelationshipManagementDeps['decisionEngine'];
  readonly intelligenceEngine?: RelationshipManagementDeps['intelligenceEngine'];
  readonly aiWorkforce?: RelationshipManagementDeps['aiWorkforce'];
  readonly businessDna?: RelationshipManagementDeps['businessDna'];
}

export interface AnalyticsRuntime {
  readonly kpis: KpiEngine;
  readonly metrics: MetricsEngine;
  readonly dashboards: DashboardEngine;
  readonly trends: TrendEngine;
  readonly aggregation: AggregationEngine;
  readonly revenueAnalytics: RevenueAnalyticsEngine;
  readonly salesAnalytics: SalesAnalyticsEngine;
  readonly marketingAnalytics: MarketingAnalyticsEngine;
  readonly communicationAnalytics: CommunicationAnalyticsEngine;
  readonly workflowAnalytics: WorkflowAnalyticsEngine;
  readonly securityAnalytics: SecurityAnalyticsEngine;
  readonly governanceAnalytics: GovernanceAnalyticsEngine;
  readonly complianceAnalytics: ComplianceAnalyticsEngine;
  readonly reports: ReportEngine;
  readonly relationships: RelationshipManagement;
  readonly queries: AnalyticsQueries;
  /** Typed event bus — subscribe to dashboard/metric/kpi/report/trend/aggregation/snapshot events. */
  readonly events: AnalyticsEventBus;
}

/** Creates a real, in-memory {@link AnalyticsRuntime}. */
export function createAnalyticsRuntime(deps: AnalyticsRuntimeDeps = {}): AnalyticsRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createAnalyticsEventBus();

  const kpiSnapshotRepository = createKpiSnapshotRepository();
  const metricSnapshotRepository = createMetricSnapshotRepository();
  const dashboardRepository = createDashboardRepository();
  const trendResultRepository = createTrendResultRepository();
  const aggregationResultRepository = createAggregationResultRepository();
  const revenueAnalyticsRepository = createRevenueAnalyticsRepository();
  const salesAnalyticsRepository = createSalesAnalyticsRepository();
  const marketingAnalyticsRepository = createMarketingAnalyticsRepository();
  const communicationAnalyticsRepository = createCommunicationAnalyticsRepository();
  const workflowAnalyticsRepository = createWorkflowAnalyticsRepository();
  const securityAnalyticsRepository = createSecurityAnalyticsRepository();
  const governanceAnalyticsRepository = createGovernanceAnalyticsRepository();
  const complianceAnalyticsRepository = createComplianceAnalyticsRepository();
  const reportRepository = createAnalyticsReportRepository();

  const kpis = createKpiEngine(kpiSnapshotRepository, eventBus, now);
  const metrics = createMetricsEngine(metricSnapshotRepository, eventBus, now);
  const dashboards = createDashboardEngine(dashboardRepository, eventBus, now);
  const trends = createTrendEngine(trendResultRepository, eventBus, now);
  const aggregation = createAggregationEngine(aggregationResultRepository, eventBus, now);
  const revenueAnalytics = createRevenueAnalyticsEngine(revenueAnalyticsRepository, { sales: deps.sales, crm: deps.crm }, eventBus, now);
  const salesAnalytics = createSalesAnalyticsEngine(salesAnalyticsRepository, { sales: deps.sales }, eventBus, now);
  const marketingAnalytics = createMarketingAnalyticsEngine(marketingAnalyticsRepository, { marketing: deps.marketing }, eventBus, now);
  const communicationAnalytics = createCommunicationAnalyticsEngine(communicationAnalyticsRepository, { communicationHub: deps.communicationHub }, eventBus, now);
  const workflowAnalytics = createWorkflowAnalyticsEngine(workflowAnalyticsRepository, { workflow: deps.workflow }, eventBus, now);
  const securityAnalytics = createSecurityAnalyticsEngine(securityAnalyticsRepository, { aiSecurity: deps.aiSecurity }, eventBus, now);
  const governanceAnalytics = createGovernanceAnalyticsEngine(governanceAnalyticsRepository, { aiGovernance: deps.aiGovernance }, eventBus, now);
  const complianceAnalytics = createComplianceAnalyticsEngine(complianceAnalyticsRepository, { aiCompliance: deps.aiCompliance }, eventBus, now);
  const reports = createReportEngine(reportRepository, eventBus, now);

  const relationships = createRelationshipManagement({
    institutionalMemory: deps.institutionalMemory,
    domainGraph: deps.domainGraph,
    decisionEngine: deps.decisionEngine,
    intelligenceEngine: deps.intelligenceEngine,
    aiWorkforce: deps.aiWorkforce,
    businessDna: deps.businessDna,
  });

  const queries = createAnalyticsQueries({
    dashboardRepository,
    kpiSnapshotRepository,
    metricSnapshotRepository,
    reportRepository,
    revenueAnalyticsRepository,
    marketingAnalyticsRepository,
    salesAnalyticsRepository,
    workflowAnalyticsRepository,
    securityAnalyticsRepository,
    complianceAnalyticsRepository,
  });

  return {
    kpis,
    metrics,
    dashboards,
    trends,
    aggregation,
    revenueAnalytics,
    salesAnalytics,
    marketingAnalytics,
    communicationAnalytics,
    workflowAnalytics,
    securityAnalytics,
    governanceAnalytics,
    complianceAnalytics,
    reports,
    relationships,
    queries,
    events: eventBus,
  };
}
