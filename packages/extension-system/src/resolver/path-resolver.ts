/** @module resolver/path-resolver */
import { join } from 'node:path';
import type { ExtensionSystemConfig } from '../configuration/types.js';
import { resolveExtensionsPath } from '../configuration/loader.js';

export class ExtensionPathResolver {
  constructor(private readonly config: ExtensionSystemConfig) {}

  resolveExtensionPath(id: string): string {
    return join(resolveExtensionsPath(this.config), id);
  }

  resolveMarketplacePath(id: string): string {
    return join(this.config.workspaceRoot, this.config.marketplaceCacheDir, id);
  }

  resolveStatePath(filename: string): string {
    return join(this.config.workspaceRoot, this.config.stateDir, filename);
  }
}

export function createPathResolver(config: ExtensionSystemConfig): ExtensionPathResolver {
  return new ExtensionPathResolver(config);
}
