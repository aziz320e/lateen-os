/** @module logging/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { LogEntryId } from '../shared/identifiers.js';

export type { LogEntryId };

/** The six deterministic log levels supported by Structured Logging. */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/** A single, immutable structured log entry. */
export interface LogEntry extends TenantAuditableEntity<LogEntryId> {
  readonly level: LogLevel;
  readonly message: string;
  /** Logical subsystem this entry belongs to (e.g. `'workflow'`, `'security'`). */
  readonly category?: string;
  /** Named scope narrower than category (e.g. a module or function name). */
  readonly scope?: string;
  /** Correlates entries across a single logical operation. */
  readonly correlationId?: string;
  /** Additional structured fields. */
  readonly fields?: Readonly<Record<string, unknown>>;
  readonly loggedAt: string;
}
