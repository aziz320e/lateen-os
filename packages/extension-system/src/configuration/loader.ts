/** @module configuration/loader */
import { join } from 'node:path';
import { extensionSystemConfigSchema, type ExtensionSystemConfig } from './types.js';

export function loadExtensionSystemConfig(workspaceRoot: string, env: NodeJS.ProcessEnv = process.env): ExtensionSystemConfig {
  return extensionSystemConfigSchema.parse({
    workspaceRoot,
    extensionsDir: env.LATEEN_EXTENSIONS_DIR ?? 'extensions',
    marketplaceCacheDir: env.LATEEN_MARKETPLACE_CACHE ?? '.lateen/marketplace',
    stateDir: env.LATEEN_EXTENSIONS_STATE ?? '.lateen/extensions',
    hotReload: env.LATEEN_EXTENSION_HOT_RELOAD === 'true',
    autoEnable: env.LATEEN_EXTENSION_AUTO_ENABLE === 'true',
    logLevel: env.LATEEN_LOG_LEVEL ?? 'info',
  });
}

export function resolveExtensionsPath(config: ExtensionSystemConfig): string {
  return join(config.workspaceRoot, config.extensionsDir);
}
