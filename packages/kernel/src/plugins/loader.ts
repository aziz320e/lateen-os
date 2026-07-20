/** @module plugins/loader */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { KernelConfig } from '../configuration/schema.js';
import { createPluginRegistry, type PluginRegistry } from '../registry/plugin-registry.js';
import type { PluginDefinition } from '../registry/types.js';

export interface PluginLoadResult {
  readonly loaded: readonly PluginDefinition[];
  readonly skipped: readonly string[];
}

export class PluginLoader {
  constructor(
    private readonly config: KernelConfig,
    private readonly registry: PluginRegistry = createPluginRegistry(),
  ) {}

  load(): PluginLoadResult {
    const loaded: PluginDefinition[] = [];
    const skipped: string[] = [];

    for (const plugin of this.registry.enabled()) {
      const absolutePath = join(this.config.workspaceRoot, plugin.path);
      if (!existsSync(absolutePath)) {
        skipped.push(plugin.id);
        continue;
      }
      loaded.push(plugin);
    }

    return { loaded, skipped };
  }

  getRegistry(): PluginRegistry {
    return this.registry;
  }
}

export function createPluginLoader(config: KernelConfig): PluginLoader {
  return new PluginLoader(config);
}
