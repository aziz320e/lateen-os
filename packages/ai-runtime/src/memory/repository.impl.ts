/** Real in-memory {@link WorkingMemoryRepository} implementation. @module memory/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { WorkingMemoryId } from '../shared/identifiers.js';
import type { WorkingMemory } from './types.js';
import type { WorkingMemoryRepository } from './repository.js';

export function createWorkingMemoryRepository(seed?: readonly WorkingMemory[]): WorkingMemoryRepository {
  const repo = createInMemoryRepository<WorkingMemory, WorkingMemoryId>({ seed });
  return {
    ...repo,
    async findBySession(organizationId, sessionId) {
      return repo.list(organizationId).find((memory) => memory.sessionId === sessionId) ?? null;
    },
  };
}
