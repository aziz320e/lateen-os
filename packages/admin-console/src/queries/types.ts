/** @module queries/types */
import type { DashboardSnapshot, DashboardSnapshotId } from '../dashboard/types.js';
import type { FeatureFlagId } from '../feature-flags/types.js';
import type { GroupId, PermissionId, Role, RoleId, RoleStatus, User, UserId, UserStatus } from '../identity/types.js';
import type { Organization, OrganizationId, OrganizationStatus } from '../organizations/types.js';
import type { Setting, SettingId, SettingScope } from '../settings/types.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { AuditEntry, AuditEntryId } from '../audit/types.js';
import type { Tenant, TenantId, TenantStatus } from '../tenants/types.js';

export interface FindOrganizationsQuery {
  readonly status?: OrganizationStatus;
  readonly offset?: number;
  readonly limit?: number;
}

export interface FindOrganizationsResult {
  readonly organizations: readonly Organization[];
  readonly total: number;
}

export interface FindTenantsQuery extends OrganizationScopedQuery {
  readonly status?: TenantStatus;
}

export interface FindTenantsResult {
  readonly tenants: readonly Tenant[];
  readonly total: number;
}

export interface FindUsersQuery extends OrganizationScopedQuery {
  readonly status?: UserStatus;
}

export interface FindUsersResult {
  readonly users: readonly User[];
  readonly total: number;
}

export interface FindRolesQuery extends OrganizationScopedQuery {
  readonly status?: RoleStatus;
}

export interface FindRolesResult {
  readonly roles: readonly Role[];
  readonly total: number;
}

export interface FindSettingsQuery extends OrganizationScopedQuery {
  readonly scope?: SettingScope;
}

export interface FindSettingsResult {
  readonly settings: readonly Setting[];
  readonly total: number;
}

export interface FindAuditsQuery extends OrganizationScopedQuery {
  readonly action?: string;
}

export interface FindAuditsResult {
  readonly audits: readonly AuditEntry[];
  readonly total: number;
}

export interface FindDashboardQuery {
  readonly organizationId: OrganizationId;
}

export interface FindDashboardResult {
  readonly dashboard: DashboardSnapshot | null;
}

export type SearchAdministrationRecordType = 'tenant' | 'user' | 'role' | 'feature-flag';

export interface SearchAdministrationQuery extends OrganizationScopedQuery {
  readonly keyword: string;
}

export interface SearchAdministrationMatch {
  readonly recordType: SearchAdministrationRecordType;
  readonly id: TenantId | UserId | RoleId | FeatureFlagId | PermissionId | GroupId | SettingId | AuditEntryId | DashboardSnapshotId;
  readonly label: string;
  readonly score: number;
}

export interface SearchAdministrationResult {
  readonly matches: readonly SearchAdministrationMatch[];
  readonly total: number;
}

export type { OrganizationId };
