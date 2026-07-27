/** @module dashboard/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { DashboardId } from '../shared/identifiers.js';

export type { DashboardId };

/** The seven executive dashboard types supported by the platform. */
export type DashboardType = 'ceo' | 'sales' | 'marketing' | 'operations' | 'security' | 'governance' | 'compliance';

/** A single configurable widget on a dashboard — references a KPI or a named metric. */
export interface DashboardWidget {
  readonly id: string;
  readonly label: string;
  readonly kpiType?: string;
  readonly metricName?: string;
  readonly config?: Readonly<Record<string, unknown>>;
}

/** A deterministic, configurable executive dashboard. */
export interface Dashboard extends TenantAuditableEntity<DashboardId> {
  readonly dashboardType: DashboardType;
  readonly name: string;
  readonly widgets: readonly DashboardWidget[];
  readonly config?: Readonly<Record<string, unknown>>;
}
