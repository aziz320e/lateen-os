/** @module logging/repository */
import type { Repository } from '../shared/repository.js';
import type { LogEntryId, OrganizationId } from '../shared/identifiers.js';
import type { LogEntry, LogLevel } from './types.js';

export interface LogEntryRepository extends Repository<LogEntry, LogEntryId> {
  findAll(organizationId: OrganizationId): Promise<readonly LogEntry[]>;
  findByLevel(organizationId: OrganizationId, level: LogLevel): Promise<readonly LogEntry[]>;
  findByCategory(organizationId: OrganizationId, category: string): Promise<readonly LogEntry[]>;
  findByCorrelationId(organizationId: OrganizationId, correlationId: string): Promise<readonly LogEntry[]>;
}
