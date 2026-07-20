/** @module permissions/checker */
import { extensionPermissionSchema, type ExtensionPermission, type PermissionCheckResult } from './types.js';

export function checkPermissions(
  requested: readonly string[],
  granted: readonly ExtensionPermission[] = [],
): PermissionCheckResult {
  const denied: ExtensionPermission[] = [];
  const grants = requested.map((raw) => {
    const parsed = extensionPermissionSchema.safeParse(raw);
    if (!parsed.success) {
      denied.push('cli:register');
      return { permission: 'cli:register' as ExtensionPermission, granted: false, reason: `Unknown permission: ${raw}` };
    }
    const allowed = granted.includes(parsed.data);
    if (!allowed) denied.push(parsed.data);
    return { permission: parsed.data, granted: allowed };
  });

  return {
    allowed: denied.length === 0,
    grants,
    denied,
  };
}

export function parsePermissions(requested: readonly string[]): ExtensionPermission[] {
  return requested
    .map((p) => extensionPermissionSchema.safeParse(p))
    .filter((r) => r.success)
    .map((r) => r.data);
}
