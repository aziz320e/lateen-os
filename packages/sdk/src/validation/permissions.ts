/** @module validation/permissions */
import type { PluginManifest, PluginPermission } from '../plugin/types.js';

export interface PermissionValidationResult {
  readonly valid: boolean;
  readonly missing: readonly PluginPermission[];
  readonly granted: readonly PluginPermission[];
}

export function validatePermissions(
  manifest: PluginManifest,
  required: readonly PluginPermission[],
): PermissionValidationResult {
  const granted = manifest.permissions;
  const missing = required.filter((permission) => !granted.includes(permission));

  return {
    valid: missing.length === 0,
    missing,
    granted,
  };
}
