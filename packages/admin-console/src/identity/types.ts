/**
 * Identity Administration types — Admin Console's own administrative
 * record of users, groups, roles, and permissions. This is
 * organizational RBAC bookkeeping only; credential verification and
 * the authentication/authorization pipeline live in AI Security
 * Engine and are never duplicated here (see `relationship-management`
 * for the real, composed link to AI Security Engine).
 *
 * @module identity/types
 */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { GroupId, PermissionId, RoleId, UserId } from '../shared/identifiers.js';

export type { GroupId, PermissionId, RoleId, UserId };

export type PermissionStatus = 'active' | 'archived';

export interface Permission extends TenantAuditableEntity<PermissionId> {
  readonly code: string;
  readonly description?: string;
  readonly status: PermissionStatus;
}

export type RoleStatus = 'active' | 'archived';

export interface Role extends TenantAuditableEntity<RoleId> {
  readonly name: string;
  readonly permissionCodes: readonly string[];
  readonly status: RoleStatus;
}

export type GroupStatus = 'active' | 'archived';

export interface Group extends TenantAuditableEntity<GroupId> {
  readonly name: string;
  readonly memberUserIds: readonly string[];
  readonly status: GroupStatus;
}

export type UserStatus = 'active' | 'suspended' | 'deactivated';

export interface User extends TenantAuditableEntity<UserId> {
  readonly email: string;
  readonly displayName: string;
  readonly roleIds: readonly RoleId[];
  readonly status: UserStatus;
}
