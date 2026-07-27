import { describe, expect, it } from 'vitest';
import { createAnalyticsRuntime } from '../src/runtime.js';

const ORG = 'org-1';

async function seed() {
  const runtime = createAnalyticsRuntime();

  const dashboard = await runtime.dashboards.create(ORG, { dashboardType: 'ceo', name: 'CEO Overview' });
  const kpi = await runtime.kpis.recordRevenue(ORG, { value: 1000 });
  const metric = await runtime.metrics.recordGauge(ORG, 'active-sessions', 10);
  const report = await runtime.reports.generateReport(ORG, { title: 'Q2 Report', format: 'json', sections: [] });
  const revenueSnapshot = await runtime.revenueAnalytics.computeSnapshot(ORG);
  const salesSnapshot = await runtime.salesAnalytics.computeSnapshot(ORG);
  const marketingSnapshot = await runtime.marketingAnalytics.computeSnapshot(ORG);
  const workflowSnapshot = await runtime.workflowAnalytics.computeSnapshot(ORG);
  const securitySnapshot = await runtime.securityAnalytics.computeSnapshot(ORG);
  const complianceSnapshot = await runtime.complianceAnalytics.computeSnapshot(ORG);

  return {
    runtime,
    dashboard,
    kpi,
    metric,
    report,
    revenueSnapshot,
    salesSnapshot,
    marketingSnapshot,
    workflowSnapshot,
    securitySnapshot,
    complianceSnapshot,
  };
}

describe('createAnalyticsQueries via createAnalyticsRuntime', () => {
  it('findDashboards() filters by dashboardType', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findDashboards({ organizationId: ORG, dashboardType: 'ceo' });
    expect(result.total).toBe(1);
  });

  it('findKPIs() filters by kpiType', async () => {
    const { runtime, kpi } = await seed();
    const result = await runtime.queries.findKPIs({ organizationId: ORG, kpiType: 'revenue' });
    expect(result.kpis.map((k) => k.id)).toEqual([kpi.id]);
  });

  it('findMetrics() filters by metricName and metricType', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findMetrics({ organizationId: ORG, metricName: 'active-sessions', metricType: 'gauge' });
    expect(result.total).toBe(1);
  });

  it('findReports() returns every generated report', async () => {
    const { runtime, report } = await seed();
    const result = await runtime.queries.findReports({ organizationId: ORG });
    expect(result.reports.map((r) => r.id)).toContain(report.id);
  });

  it('findRevenueAnalytics() returns every computed snapshot', async () => {
    const { runtime, revenueSnapshot } = await seed();
    const result = await runtime.queries.findRevenueAnalytics({ organizationId: ORG });
    expect(result.snapshots.map((s) => s.id)).toEqual([revenueSnapshot.id]);
  });

  it('findSalesAnalytics() returns every computed snapshot', async () => {
    const { runtime, salesSnapshot } = await seed();
    const result = await runtime.queries.findSalesAnalytics({ organizationId: ORG });
    expect(result.snapshots.map((s) => s.id)).toEqual([salesSnapshot.id]);
  });

  it('findMarketingAnalytics() returns every computed snapshot', async () => {
    const { runtime, marketingSnapshot } = await seed();
    const result = await runtime.queries.findMarketingAnalytics({ organizationId: ORG });
    expect(result.snapshots.map((s) => s.id)).toEqual([marketingSnapshot.id]);
  });

  it('findWorkflowAnalytics() returns every computed snapshot', async () => {
    const { runtime, workflowSnapshot } = await seed();
    const result = await runtime.queries.findWorkflowAnalytics({ organizationId: ORG });
    expect(result.snapshots.map((s) => s.id)).toEqual([workflowSnapshot.id]);
  });

  it('findSecurityAnalytics() returns every computed snapshot', async () => {
    const { runtime, securitySnapshot } = await seed();
    const result = await runtime.queries.findSecurityAnalytics({ organizationId: ORG });
    expect(result.snapshots.map((s) => s.id)).toEqual([securitySnapshot.id]);
  });

  it('findComplianceAnalytics() returns every computed snapshot', async () => {
    const { runtime, complianceSnapshot } = await seed();
    const result = await runtime.queries.findComplianceAnalytics({ organizationId: ORG });
    expect(result.snapshots.map((s) => s.id)).toEqual([complianceSnapshot.id]);
  });

  it('searchAnalytics() ranks an exact match above a substring match', async () => {
    const { runtime } = await seed();
    await runtime.dashboards.create(ORG, { dashboardType: 'sales', name: 'CEO Overview Extended' });
    const result = await runtime.queries.searchAnalytics({ organizationId: ORG, keyword: 'CEO Overview' });
    expect(result.matches[0]?.label).toBe('CEO Overview');
    expect(result.matches[0]?.score).toBeGreaterThan(result.matches[1]!.score);
  });

  it('searchAnalytics() searches across dashboards, kpis, metrics, and reports', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.searchAnalytics({ organizationId: ORG, keyword: 'active-sessions' });
    expect(result.matches.some((m) => m.recordType === 'metric')).toBe(true);
  });

  it('searchAnalytics() returns no matches for an unrelated keyword', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.searchAnalytics({ organizationId: ORG, keyword: 'nonexistent-keyword' });
    expect(result.matches).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('paginates via offset/limit while total reflects the full match set', async () => {
    const { runtime } = await seed();
    await runtime.dashboards.create(ORG, { dashboardType: 'sales', name: 'Sales' });
    const all = await runtime.queries.findDashboards({ organizationId: ORG });
    const page = await runtime.queries.findDashboards({ organizationId: ORG, offset: 1, limit: 1 });
    expect(page.dashboards).toHaveLength(1);
    expect(page.total).toBe(all.total);
  });

  it('is organization-scoped', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findDashboards({ organizationId: 'org-2' });
    expect(result.total).toBe(0);
  });
});
