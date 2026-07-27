/** Real, in-memory {@link AuditTimelineRepository} implementation. @module audit-timeline/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AuditTimelineRepository } from './repository.js';
import type { AuditTimelineEntry } from './types.js';

/** Creates a real, in-memory {@link AuditTimelineRepository}. */
export function createAuditTimelineRepository(seed?: readonly AuditTimelineEntry[]): AuditTimelineRepository {
  const repo = createInMemoryRepository<AuditTimelineEntry>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findBySource(organizationId, source) {
      return repo.list(organizationId).filter((entry) => entry.source === source);
    },
  };
}
