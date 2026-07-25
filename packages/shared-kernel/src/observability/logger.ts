/**
 * Shared structured logger factory — pino-based, consistent service/environment
 * base fields across every package and service in the monorepo.
 *
 * @module observability/logger
 */
import pino, { type Logger, type LoggerOptions } from 'pino';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

export interface CreateLoggerOptions {
  readonly level?: LogLevel;
  readonly environment?: string;
  /** Additional static base fields merged into every log line. */
  readonly base?: Record<string, unknown>;
  /** Escape hatch for callers that need full pino option control. */
  readonly pino?: LoggerOptions;
}

/** Creates a structured pino logger with a consistent `service`/`environment` base. */
export function createLogger(serviceName: string, options: CreateLoggerOptions = {}): Logger {
  return pino({
    level: options.level ?? 'info',
    base: {
      service: serviceName,
      ...(options.environment ? { environment: options.environment } : {}),
      ...options.base,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...options.pino,
  });
}

export type { Logger };
