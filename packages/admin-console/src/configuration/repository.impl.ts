/** Real, in-memory Runtime Configuration repository. @module configuration/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { RuntimeConfigRepository } from './repository.js';
import type { RuntimeConfigEntry } from './types.js';

/** Creates a real, in-memory {@link RuntimeConfigRepository}. */
export function createRuntimeConfigRepository(seed?: readonly RuntimeConfigEntry[]): RuntimeConfigRepository {
  const repo = createInMemoryRepository<RuntimeConfigEntry>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
