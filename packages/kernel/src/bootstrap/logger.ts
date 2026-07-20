/** @module bootstrap/logger */
import pino from 'pino';
import type { KernelConfig } from '../configuration/schema.js';

export function createKernelLogger(config: KernelConfig) {
  return pino({
    level: config.logLevel,
    base: {
      service: 'lateen-kernel',
      environment: config.environment,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export type KernelLogger = ReturnType<typeof createKernelLogger>;
