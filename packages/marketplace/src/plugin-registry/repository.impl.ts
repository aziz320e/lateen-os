/** Real, in-memory Plugin repository. @module plugin-registry/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { PluginRepository } from './repository.js';
import type { Plugin } from './types.js';

/** Creates a real, in-memory {@link PluginRepository}. */
export function createPluginRepository(seed?: readonly Plugin[]): PluginRepository {
  const repo = createInMemoryRepository<Plugin>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByKey(organizationId, key) {
      return repo.list(organizationId).find((plugin) => plugin.key === key) ?? null;
    },
  };
}
