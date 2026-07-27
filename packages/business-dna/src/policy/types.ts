/** @module policy/types */
import type { Entity } from '../shared/entity.js';
import type {
  DepartmentId,
  EmployeeId,
  OrganizationId,
  PolicyId,
} from '../shared/identifiers.js';
import type {
  Auditable,
  BusinessCode,
  ISODate,
  ISODateTime,
  TenantScoped,
} from '../shared/primitives.js';

export type PolicyStatus = 'draft' | 'active' | 'suspended' | 'archived';
export type PolicyType =
  | 'compliance'
  | 'financial'
  | 'operational'
  | 'security'
  | 'hr'
  | 'sales'
  | 'business'
  | 'approval'
  | 'communication';
export type PolicySeverity = 'info' | 'warning' | 'critical';

export interface Policy extends Entity<PolicyId>, TenantScoped, Auditable {
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly type: PolicyType;
  readonly status: PolicyStatus;
  readonly severity?: PolicySeverity;
  readonly entityType?: string;
  readonly effectiveFrom?: ISODate;
  readonly effectiveUntil?: ISODate;
  readonly ownerDepartmentId?: DepartmentId;
  readonly approvedById?: EmployeeId;
  readonly approvedAt?: ISODateTime;
}

export type { OrganizationId };
