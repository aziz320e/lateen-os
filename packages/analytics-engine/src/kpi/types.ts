/** @module kpi/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { KpiSnapshotId } from '../shared/identifiers.js';

export type { KpiSnapshotId };

/** The twelve deterministic KPIs supported by the KPI Engine. */
export type KpiType =
  | 'revenue'
  | 'pipeline_value'
  | 'conversion_rate'
  | 'win_rate'
  | 'average_deal_size'
  | 'customer_acquisition_cost'
  | 'customer_lifetime_value'
  | 'marketing_roi'
  | 'campaign_performance'
  | 'response_time'
  | 'workflow_completion'
  | 'workforce_utilization';

export type KpiUnit = 'currency' | 'percentage' | 'ratio' | 'count' | 'minutes';

/** A single, deterministic KPI value at a point in time. */
export interface KpiSnapshot extends TenantAuditableEntity<KpiSnapshotId> {
  readonly kpiType: KpiType;
  readonly value: number;
  readonly unit: KpiUnit;
  readonly context?: Readonly<Record<string, unknown>>;
  readonly calculatedAt: string;
}
