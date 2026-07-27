/**
 * Real Structured Logging engine — trace/debug/info/warn/error/fatal
 * levels, structured fields, scopes, categories, and correlation ids.
 *
 * @module logging/engine.impl
 */
import type { ObservabilityEventBus } from '../events/observability-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { LogEntryId, OrganizationId } from '../shared/identifiers.js';
import type { LogEntryRepository } from './repository.js';
import type { LogEntry, LogLevel } from './types.js';

export interface LogInput {
  readonly category?: string;
  readonly scope?: string;
  readonly correlationId?: string;
  readonly fields?: Readonly<Record<string, unknown>>;
}

export interface LoggingEngine {
  log(organizationId: OrganizationId, level: LogLevel, message: string, input?: LogInput): Promise<LogEntry>;
  trace(organizationId: OrganizationId, message: string, input?: LogInput): Promise<LogEntry>;
  debug(organizationId: OrganizationId, message: string, input?: LogInput): Promise<LogEntry>;
  info(organizationId: OrganizationId, message: string, input?: LogInput): Promise<LogEntry>;
  warn(organizationId: OrganizationId, message: string, input?: LogInput): Promise<LogEntry>;
  error(organizationId: OrganizationId, message: string, input?: LogInput): Promise<LogEntry>;
  fatal(organizationId: OrganizationId, message: string, input?: LogInput): Promise<LogEntry>;
  get(organizationId: OrganizationId, logEntryId: LogEntryId): Promise<LogEntry | null>;
  list(organizationId: OrganizationId): Promise<readonly LogEntry[]>;
}

/** Creates a real {@link LoggingEngine} over the given repository. */
export function createLoggingEngine(
  repository: LogEntryRepository,
  eventBus?: ObservabilityEventBus,
  now: () => string = nowIso,
): LoggingEngine {
  async function log(organizationId: OrganizationId, level: LogLevel, message: string, input: LogInput = {}): Promise<LogEntry> {
    const timestamp = now();
    const entry: LogEntry = {
      id: generateId('log-entry'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      level,
      message,
      category: input.category,
      scope: input.scope,
      correlationId: input.correlationId,
      fields: input.fields,
      loggedAt: timestamp,
    };
    await repository.save(entry);
    eventBus?.publish('log.created', { organizationId, logEntryId: entry.id, level, category: entry.category ?? 'uncategorized' });
    return entry;
  }

  return {
    log,
    trace: (organizationId, message, input) => log(organizationId, 'trace', message, input),
    debug: (organizationId, message, input) => log(organizationId, 'debug', message, input),
    info: (organizationId, message, input) => log(organizationId, 'info', message, input),
    warn: (organizationId, message, input) => log(organizationId, 'warn', message, input),
    error: (organizationId, message, input) => log(organizationId, 'error', message, input),
    fatal: (organizationId, message, input) => log(organizationId, 'fatal', message, input),

    async get(organizationId, logEntryId) {
      return repository.findById(organizationId, logEntryId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
