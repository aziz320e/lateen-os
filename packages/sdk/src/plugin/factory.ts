/** @module plugin/factory */
import type { SDKContext } from '../core/types.js';
import { formatSdkVersion } from '../core/version.js';
import {
  pluginManifestInputSchema,
  type PluginLifecycleHooks,
  type PluginManifest,
  type PluginManifestInput,
} from './types.js';

export interface PluginFactory {
  define(input: PluginManifestInput): PluginManifest;
  withLifecycle(manifest: PluginManifest, hooks: PluginLifecycleHooks): PluginManifest & { hooks: PluginLifecycleHooks };
}

export function createPluginFactory(_context: SDKContext): PluginFactory {
  return {
    define(input) {
      const parsed = pluginManifestInputSchema.parse(input);
      return {
        ...parsed,
        enabled: true,
        sdkVersion: formatSdkVersion(),
      };
    },
    withLifecycle(manifest, hooks) {
      return { ...manifest, hooks };
    },
  };
}

export const definePlugin = (input: PluginManifestInput): PluginManifest =>
  createPluginFactory({
    config: { workspaceRoot: process.cwd(), environment: 'development' },
    version: { major: 1, minor: 0, patch: 0, architecture: '1.0' },
    createdAt: new Date().toISOString(),
  }).define(input);
