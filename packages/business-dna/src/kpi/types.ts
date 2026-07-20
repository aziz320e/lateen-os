/** @module kpi/types */
import type { Entity } from '../shared/entity.js';
import type {
  BranchId,
  DepartmentId,
  EntityId,
  KpiId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { Auditable, BusinessCode, TenantScoped } from '../shared/primitives.js';

export type KpiStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type KpiType =
  | 'financial'
  | 'operational'
  | 'sales'
  | 'customer'
  | 'hr'
  | 'quality';
export type KpiDirection = 'higher_is_better' | 'lower_is_better' | 'target_is_best';
export type KpiFrequency =
  | 'real_time'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annual';

export interface Kpi extends Entity<KpiId>, TenantScoped, Auditable {
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly type: KpiType;
  readonly status: KpiStatus;
  readonly unit: string;
  readonly direction: KpiDirection;
  readonly target?: string;
  readonly warningThreshold?: string;
  readonly criticalThreshold?: string;
  readonly frequency: KpiFrequency;
  readonly departmentId?: DepartmentId;
  readonly branchId?: BranchId;
  readonly entityType?: string;
  readonly entityId?: EntityId;
}

export type { OrganizationId };
