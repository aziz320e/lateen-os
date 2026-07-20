/**
 * Role value objects.
 * @module role/value-objects
 */

import type { PermissionId, RoleId } from '../shared/identifiers.js';
import type { RoleType } from './types.js';

/** Role inheritance link to a parent role. */
export interface RoleInheritance {
  readonly parentRoleId: RoleId;
}

/** Permissions granted through a role assignment. */
export interface RolePermissionGrant {
  readonly permissionIds: readonly PermissionId[];
}

/** Constraints for assigning a role to an actor. */
export interface RoleAssignmentPolicy {
  readonly roleType: RoleType;
  readonly assignableToHuman: boolean;
  readonly assignableToAgent: boolean;
}
