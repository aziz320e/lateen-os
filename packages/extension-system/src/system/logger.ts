/** @module system/logger */
import pino from 'pino';
import type { ExtensionSystemConfig } from '../configuration/types.js';

export function createExtensionLogger(config: ExtensionSystemConfig) {
  return pino({
    level: config.logLevel,
    base: { service: 'lateen-extension-system' },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export type ExtensionLogger = ReturnType<typeof createExtensionLogger>;
