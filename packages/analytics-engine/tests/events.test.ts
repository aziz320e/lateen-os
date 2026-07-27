import { describe, expect, it, vi } from 'vitest';
import { createAnalyticsEventBus } from '../src/events/analytics-event-bus.js';
import { ANALYTICS_EVENT_NAMES } from '../src/events/analytics-events.js';
import { createAnalyticsRuntime } from '../src/runtime.js';

describe('ANALYTICS_EVENT_NAMES', () => {
  it('declares exactly the 8 required event names', () => {
    expect(Object.values(ANALYTICS_EVENT_NAMES).sort()).toEqual(
      [
        'dashboard.created',
        'dashboard.updated',
        'metric.calculated',
        'kpi.updated',
        'report.generated',
        'trend.updated',
        'aggregation.completed',
        'analytics.snapshot.created',
      ].sort(),
    );
  });
});

describe('createAnalyticsEventBus', () => {
  it('dispatches to subscribers of the exact event name only', () => {
    const eventBus = createAnalyticsEventBus();
    const dashboardCreated = vi.fn();
    const reportGenerated = vi.fn();
    eventBus.subscribe('dashboard.created', dashboardCreated);
    eventBus.subscribe('report.generated', reportGenerated);

    eventBus.publish('dashboard.created', { organizationId: 'org-1', dashboardId: 'd1', dashboardType: 'ceo' });

    expect(dashboardCreated).toHaveBeenCalledTimes(1);
    expect(reportGenerated).not.toHaveBeenCalled();
  });
});

describe('end-to-end event flow through createAnalyticsRuntime()', () => {
  it('every declared event is genuinely published by the real service that causes it', async () => {
    const runtime = createAnalyticsRuntime();
    const seen: string[] = [];
    for (const eventName of Object.values(ANALYTICS_EVENT_NAMES)) {
      runtime.events.subscribe(eventName, () => seen.push(eventName));
    }

    const ORG = 'org-1';

    const dashboard = await runtime.dashboards.create(ORG, { dashboardType: 'ceo', name: 'd' });
    await runtime.dashboards.update(ORG, dashboard.id, { name: 'd2' });
    await runtime.kpis.recordRevenue(ORG, { value: 100 });
    await runtime.metrics.recordGauge(ORG, 'g', 1);
    await runtime.reports.generateReport(ORG, { title: 't', format: 'json', sections: [] });
    await runtime.trends.computeTrend(ORG, { granularity: 'day', points: [] });
    await runtime.aggregation.aggregate(ORG, { records: [{ a: 1 }], groupByKey: 'a', groupFn: () => 'x', valueFn: () => 1 });
    // Any one category analytics engine's computeSnapshot() publishes the
    // generic analytics.snapshot.created event.
    await runtime.revenueAnalytics.computeSnapshot(ORG);

    await Promise.resolve();

    expect(new Set(seen)).toEqual(new Set(Object.values(ANALYTICS_EVENT_NAMES)));
  });

  it('every one of the 8 category analytics engines publishes analytics.snapshot.created on computeSnapshot()', async () => {
    const runtime = createAnalyticsRuntime();
    const categoriesSeen: string[] = [];
    runtime.events.subscribe('analytics.snapshot.created', (payload) => categoriesSeen.push(payload.category));

    const ORG = 'org-1';
    await runtime.revenueAnalytics.computeSnapshot(ORG);
    await runtime.salesAnalytics.computeSnapshot(ORG);
    await runtime.marketingAnalytics.computeSnapshot(ORG);
    await runtime.communicationAnalytics.computeSnapshot(ORG);
    await runtime.workflowAnalytics.computeSnapshot(ORG);
    await runtime.securityAnalytics.computeSnapshot(ORG);
    await runtime.governanceAnalytics.computeSnapshot(ORG);
    await runtime.complianceAnalytics.computeSnapshot(ORG);

    expect(new Set(categoriesSeen)).toEqual(
      new Set(['revenue', 'sales', 'marketing', 'communication', 'workflow', 'security', 'governance', 'compliance']),
    );
  });
});
