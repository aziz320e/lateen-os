/** @module dashboard/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { DashboardSnapshotId } from '../shared/identifiers.js';

export type { DashboardSnapshotId };

export type SystemStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface TenantStatusSummary {
  readonly tenantId: string;
  readonly name: string;
  readonly status: string;
}

export interface HealthSummary {
  readonly checkedServices: number;
  readonly unhealthyServices: number;
}

export interface AlertsSummary {
  readonly auditEntryCount: number;
}

/** One generated administration dashboard snapshot for one organization. */
export interface DashboardSnapshot extends TenantAuditableEntity<DashboardSnapshotId> {
  readonly kpis: Readonly<Record<string, number>>;
  readonly systemStatus: SystemStatus;
  readonly tenantStatus: readonly TenantStatusSummary[];
  readonly healthSummary: HealthSummary;
  readonly alertsSummary: AlertsSummary;
  readonly generatedAt: string;
}
