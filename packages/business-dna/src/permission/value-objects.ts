/**
 * Permission value objects.
 * @module permission/value-objects
 */

import type { PermissionAction, PermissionScope } from './types.js';

/** Resource and action pair forming a permission code (`{resource}.{action}`). */
export interface PermissionDescriptor {
  readonly resource: string;
  readonly action: PermissionAction;
}

/** Scoped access rule evaluated by Core authorization. */
export interface PermissionGrant {
  readonly descriptor: PermissionDescriptor;
  readonly scope: PermissionScope;
}
