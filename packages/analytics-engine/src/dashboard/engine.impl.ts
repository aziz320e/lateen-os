/**
 * Real Executive Dashboard engine — deterministic, configurable
 * dashboards across the seven required dashboard types.
 *
 * @module dashboard/engine.impl
 */
import type { AnalyticsEventBus } from '../events/analytics-event-bus.js';
import { DashboardNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { DashboardId, OrganizationId } from '../shared/identifiers.js';
import type { DashboardRepository } from './repository.js';
import type { Dashboard, DashboardType, DashboardWidget } from './types.js';

export interface CreateDashboardInput {
  readonly dashboardType: DashboardType;
  readonly name: string;
  readonly widgets?: readonly Omit<DashboardWidget, 'id'>[];
  readonly config?: Readonly<Record<string, unknown>>;
}

export interface UpdateDashboardInput {
  readonly name?: string;
  readonly widgets?: readonly Omit<DashboardWidget, 'id'>[];
  readonly config?: Readonly<Record<string, unknown>>;
}

export interface DashboardEngine {
  create(organizationId: OrganizationId, input: CreateDashboardInput): Promise<Dashboard>;
  update(organizationId: OrganizationId, dashboardId: DashboardId, input: UpdateDashboardInput): Promise<Dashboard>;
  get(organizationId: OrganizationId, dashboardId: DashboardId): Promise<Dashboard | null>;
  findByType(organizationId: OrganizationId, dashboardType: DashboardType): Promise<readonly Dashboard[]>;
  list(organizationId: OrganizationId): Promise<readonly Dashboard[]>;
}

/** Creates a real {@link DashboardEngine} backed by a {@link DashboardRepository}. */
export function createDashboardEngine(
  repository: DashboardRepository,
  eventBus?: AnalyticsEventBus,
  now: () => string = nowIso,
): DashboardEngine {
  async function requireDashboard(organizationId: OrganizationId, dashboardId: DashboardId): Promise<Dashboard> {
    const dashboard = await repository.findById(organizationId, dashboardId);
    if (!dashboard) throw new DashboardNotFoundError(dashboardId);
    return dashboard;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const dashboard: Dashboard = {
        id: generateId('dashboard'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        dashboardType: input.dashboardType,
        name: input.name,
        widgets: (input.widgets ?? []).map((widget) => ({ ...widget, id: generateId('dashboard-widget') })),
        config: input.config,
      };
      await repository.save(dashboard);
      eventBus?.publish('dashboard.created', { organizationId, dashboardId: dashboard.id, dashboardType: dashboard.dashboardType });
      return dashboard;
    },

    async update(organizationId, dashboardId, input) {
      const dashboard = await requireDashboard(organizationId, dashboardId);
      const updated: Dashboard = {
        ...dashboard,
        name: input.name ?? dashboard.name,
        widgets: input.widgets ? input.widgets.map((widget) => ({ ...widget, id: generateId('dashboard-widget') })) : dashboard.widgets,
        config: input.config ?? dashboard.config,
        updatedAt: now(),
      };
      await repository.save(updated);
      eventBus?.publish('dashboard.updated', { organizationId, dashboardId });
      return updated;
    },

    async get(organizationId, dashboardId) {
      return repository.findById(organizationId, dashboardId);
    },

    async findByType(organizationId, dashboardType) {
      return repository.findByType(organizationId, dashboardType);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
