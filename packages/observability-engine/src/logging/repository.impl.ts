/** Real, in-memory {@link LogEntryRepository} implementation. @module logging/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { LogEntryRepository } from './repository.js';
import type { LogEntry } from './types.js';

/** Creates a real, in-memory {@link LogEntryRepository}. */
export function createLogEntryRepository(seed?: readonly LogEntry[]): LogEntryRepository {
  const repo = createInMemoryRepository<LogEntry>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByLevel(organizationId, level) {
      return repo.list(organizationId).filter((entry) => entry.level === level);
    },
    async findByCategory(organizationId, category) {
      return repo.list(organizationId).filter((entry) => entry.category === category);
    },
    async findByCorrelationId(organizationId, correlationId) {
      return repo.list(organizationId).filter((entry) => entry.correlationId === correlationId);
    },
  };
}
