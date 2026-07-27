import { describe, expect, it } from 'vitest';
import { createAnalyticsRuntime } from '../src/runtime.js';
import { createAnalyticsEventBus } from '../src/events/analytics-event-bus.js';

describe('createAnalyticsRuntime', () => {
  it('exposes only services, queries, and the event bus — never repositories', () => {
    const runtime = createAnalyticsRuntime();
    expect(Object.keys(runtime).sort()).toEqual(
      [
        'kpis',
        'metrics',
        'dashboards',
        'trends',
        'aggregation',
        'revenueAnalytics',
        'salesAnalytics',
        'marketingAnalytics',
        'communicationAnalytics',
        'workflowAnalytics',
        'securityAnalytics',
        'governanceAnalytics',
        'complianceAnalytics',
        'reports',
        'relationships',
        'queries',
        'events',
      ].sort(),
    );
  });

  it('accepts an injected eventBus and now()', async () => {
    const eventBus = createAnalyticsEventBus();
    const fixedNow = '2024-01-01T00:00:00.000Z';
    const runtime = createAnalyticsRuntime({ eventBus, now: () => fixedNow });

    expect(runtime.events).toBe(eventBus);
    const dashboard = await runtime.dashboards.create('org-1', { dashboardType: 'ceo', name: 'd' });
    expect(dashboard.createdAt).toBe(fixedNow);
  });

  it('is fully usable offline with zero injected collaborators', async () => {
    const runtime = createAnalyticsRuntime();
    expect(await runtime.relationships.getBusinessProfileContext('org-1')).toBeNull();
    const revenueSnapshot = await runtime.revenueAnalytics.computeSnapshot('org-1');
    expect(revenueSnapshot.mrr).toBe(0);
  });

  it('runtime instances are independent — no shared module-level state', async () => {
    const runtimeA = createAnalyticsRuntime();
    const runtimeB = createAnalyticsRuntime();
    await runtimeA.dashboards.create('org-1', { dashboardType: 'ceo', name: 'd' });

    const result = await runtimeB.queries.findDashboards({ organizationId: 'org-1' });
    expect(result.total).toBe(0);
  });

  it('the query layer reads the same persisted data exposed on the runtime services', async () => {
    const runtime = createAnalyticsRuntime();
    const kpi = await runtime.kpis.recordRevenue('org-1', { value: 500 });
    const result = await runtime.queries.findKPIs({ organizationId: 'org-1', kpiType: 'revenue' });
    expect(result.kpis.map((k) => k.id)).toEqual([kpi.id]);
  });

  it('governance and communication analytics remain reachable via their own service even though the query layer has no dedicated find* method for them', async () => {
    const runtime = createAnalyticsRuntime();
    const snapshot = await runtime.governanceAnalytics.computeSnapshot('org-1');
    expect(snapshot.activePolicies).toBe(0);
    const communicationSnapshot = await runtime.communicationAnalytics.computeSnapshot('org-1');
    expect(communicationSnapshot.messageVolume).toBe(0);
  });
});
