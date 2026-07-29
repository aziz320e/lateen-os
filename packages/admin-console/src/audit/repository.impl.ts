/** Real, in-memory Audit Entry repository. @module audit/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AuditEntryRepository } from './repository.js';
import type { AuditEntry } from './types.js';

/** Creates a real, in-memory {@link AuditEntryRepository}. */
export function createAuditEntryRepository(seed?: readonly AuditEntry[]): AuditEntryRepository {
  const repo = createInMemoryRepository<AuditEntry>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
