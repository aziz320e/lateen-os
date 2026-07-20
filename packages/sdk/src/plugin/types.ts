/** @module plugin/types */
import { z } from 'zod';

export const pluginPermissionSchema = z.enum([
  'read:business-dna',
  'write:business-dna',
  'read:workflows',
  'write:workflows',
  'read:missions',
  'write:missions',
  'read:workers',
  'write:workers',
  'read:connectors',
  'write:connectors',
  'publish:events',
  'subscribe:events',
]);

export const pluginCapabilitySchema = z.string().min(1);

export const pluginLifecycleSchema = z.enum([
  'register',
  'initialize',
  'activate',
  'deactivate',
  'unregister',
]);

export const pluginManifestInputSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  kind: z.enum(['application', 'service', 'package', 'ai-worker', 'connector', 'workflow', 'mission']),
  description: z.string().optional(),
  path: z.string().min(1),
  dependencies: z.array(z.string()).default([]),
  permissions: z.array(pluginPermissionSchema).default([]),
  capabilities: z.array(pluginCapabilitySchema).default([]),
});

export type PluginPermission = z.infer<typeof pluginPermissionSchema>;
export type PluginCapability = z.infer<typeof pluginCapabilitySchema>;
export type PluginLifecycle = z.infer<typeof pluginLifecycleSchema>;
export type PluginManifestInput = z.infer<typeof pluginManifestInputSchema>;

export interface PluginManifest extends PluginManifestInput {
  readonly sdkVersion: string;
  readonly enabled: boolean;
}

export interface PluginLifecycleHooks {
  readonly onRegister?: () => void | Promise<void>;
  readonly onInitialize?: () => void | Promise<void>;
  readonly onActivate?: () => void | Promise<void>;
  readonly onDeactivate?: () => void | Promise<void>;
  readonly onUnregister?: () => void | Promise<void>;
}
