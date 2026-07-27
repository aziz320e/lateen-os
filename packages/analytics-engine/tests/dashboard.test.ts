import { describe, expect, it } from 'vitest';
import { createDashboardRepository } from '../src/dashboard/repository.impl.js';
import { createDashboardEngine } from '../src/dashboard/engine.impl.js';
import { createAnalyticsEventBus } from '../src/events/index.js';
import { DashboardNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createAnalyticsEventBus()) {
  const repository = createDashboardRepository();
  const engine = createDashboardEngine(repository, eventBus);
  return { repository, engine, eventBus };
}

describe('createDashboardEngine — create', () => {
  it('creates a dashboard with generated widget ids', async () => {
    const { engine } = setup();
    const dashboard = await engine.create(ORG, {
      dashboardType: 'ceo',
      name: 'CEO Overview',
      widgets: [{ label: 'Revenue', kpiType: 'revenue' }],
    });
    expect(dashboard.widgets).toHaveLength(1);
    expect(dashboard.widgets[0]?.id).toBeDefined();
    expect(dashboard.widgets[0]?.label).toBe('Revenue');
  });

  it('defaults to an empty widget list', async () => {
    const { engine } = setup();
    const dashboard = await engine.create(ORG, { dashboardType: 'sales', name: 'Sales' });
    expect(dashboard.widgets).toEqual([]);
  });

  it('supports all seven dashboard types', async () => {
    const { engine } = setup();
    const types = ['ceo', 'sales', 'marketing', 'operations', 'security', 'governance', 'compliance'] as const;
    for (const dashboardType of types) {
      const dashboard = await engine.create(ORG, { dashboardType, name: `d-${dashboardType}` });
      expect(dashboard.dashboardType).toBe(dashboardType);
    }
  });

  it('publishes dashboard.created', async () => {
    const eventBus = createAnalyticsEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('dashboard.created', (payload) => (seen = payload));
    const dashboard = await engine.create(ORG, { dashboardType: 'ceo', name: 'CEO' });
    expect(seen).toEqual({ organizationId: ORG, dashboardId: dashboard.id, dashboardType: 'ceo' });
  });
});

describe('createDashboardEngine — update', () => {
  it('updates the name and widgets', async () => {
    const { engine } = setup();
    const dashboard = await engine.create(ORG, { dashboardType: 'ceo', name: 'CEO' });
    const updated = await engine.update(ORG, dashboard.id, { name: 'CEO v2', widgets: [{ label: 'ARR', kpiType: 'revenue' }] });
    expect(updated.name).toBe('CEO v2');
    expect(updated.widgets).toHaveLength(1);
  });

  it('publishes dashboard.updated', async () => {
    const eventBus = createAnalyticsEventBus();
    const { engine } = setup(eventBus);
    const dashboard = await engine.create(ORG, { dashboardType: 'ceo', name: 'CEO' });
    let seen: unknown;
    eventBus.subscribe('dashboard.updated', (payload) => (seen = payload));
    await engine.update(ORG, dashboard.id, { name: 'CEO v2' });
    expect(seen).toEqual({ organizationId: ORG, dashboardId: dashboard.id });
  });

  it('throws DashboardNotFoundError for an unknown dashboard', async () => {
    const { engine } = setup();
    await expect(engine.update(ORG, 'missing', { name: 'x' })).rejects.toBeInstanceOf(DashboardNotFoundError);
  });

  it('preserves the config when not overridden', async () => {
    const { engine } = setup();
    const dashboard = await engine.create(ORG, { dashboardType: 'ceo', name: 'CEO', config: { theme: 'dark' } });
    const updated = await engine.update(ORG, dashboard.id, { name: 'CEO v2' });
    expect(updated.config).toEqual({ theme: 'dark' });
  });
});

describe('createDashboardEngine — get / findByType / list / org scoping', () => {
  it('get() returns null for an unknown dashboard', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('findByType() filters correctly', async () => {
    const { engine } = setup();
    await engine.create(ORG, { dashboardType: 'ceo', name: 'a' });
    await engine.create(ORG, { dashboardType: 'sales', name: 'b' });
    const salesDashboards = await engine.findByType(ORG, 'sales');
    expect(salesDashboards).toHaveLength(1);
  });

  it('list() returns every dashboard', async () => {
    const { engine } = setup();
    await engine.create(ORG, { dashboardType: 'ceo', name: 'a' });
    await engine.create(ORG, { dashboardType: 'sales', name: 'b' });
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const dashboard = await engine.create(ORG, { dashboardType: 'ceo', name: 'a' });
    expect(await repository.findById('org-2', dashboard.id)).toBeNull();
  });
});
