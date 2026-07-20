/** @module permissions/types */
import { z } from 'zod';

export const extensionPermissionSchema = z.enum([
  'filesystem:read',
  'filesystem:write',
  'network:outbound',
  'network:inbound',
  'business-dna:read',
  'business-dna:write',
  'workflow:read',
  'workflow:write',
  'decision:read',
  'decision:write',
  'identity:read',
  'identity:write',
  'memory:read',
  'memory:write',
  'ai-runtime:invoke',
  'integration-hub:read',
  'integration-hub:write',
  'cli:register',
  'events:publish',
  'events:subscribe',
]);

export type ExtensionPermission = z.infer<typeof extensionPermissionSchema>;

export interface PermissionGrant {
  readonly permission: ExtensionPermission;
  readonly granted: boolean;
  readonly reason?: string;
}

export interface PermissionCheckResult {
  readonly allowed: boolean;
  readonly grants: readonly PermissionGrant[];
  readonly denied: readonly ExtensionPermission[];
}
