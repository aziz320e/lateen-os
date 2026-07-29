/** Real, in-memory Extension repository. @module extension-registry/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ExtensionRepository } from './repository.js';
import type { Extension } from './types.js';

/** Creates a real, in-memory {@link ExtensionRepository}. */
export function createExtensionRepository(seed?: readonly Extension[]): ExtensionRepository {
  const repo = createInMemoryRepository<Extension>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByKey(organizationId, key) {
      return repo.list(organizationId).find((extension) => extension.key === key) ?? null;
    },
  };
}
