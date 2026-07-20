/** @module role/types */
import type { Entity } from '../shared/entity.js';
import type {
  DepartmentId,
  OrganizationId,
  PermissionId,
  RoleId,
} from '../shared/identifiers.js';
import type { Auditable, BusinessCode, TenantScoped } from '../shared/primitives.js';

export type { RoleId };

export type RoleType = 'human' | 'agent' | 'system' | 'hybrid';
export type RoleStatus = 'draft' | 'active' | 'inactive' | 'archived';

/** Named set of responsibilities; bundles permissions for employees and AI agents. */
export interface Role extends Entity<RoleId>, TenantScoped, Auditable {
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly type: RoleType;
  readonly status: RoleStatus;
  readonly parentRoleId?: RoleId;
  readonly departmentId?: DepartmentId;
  readonly permissionIds?: readonly PermissionId[];
}

export type { OrganizationId, PermissionId };
