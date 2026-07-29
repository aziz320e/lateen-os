/** @module tenants/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { EnvironmentId, TenantId } from '../shared/identifiers.js';

export type { EnvironmentId, TenantId };

export type TenantStatus = 'active' | 'suspended' | 'archived';

/** A tenant within an organization — the sub-partition an organization administers for its own customers/business units. */
export interface Tenant extends TenantAuditableEntity<TenantId> {
  readonly name: string;
  readonly status: TenantStatus;
}

export type EnvironmentType = 'development' | 'staging' | 'production';
export type EnvironmentStatus = 'active' | 'disabled';

/** A deployment environment scoped to one tenant (e.g. that tenant's staging environment). */
export interface Environment extends TenantAuditableEntity<EnvironmentId> {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly environmentType: EnvironmentType;
  readonly status: EnvironmentStatus;
}
