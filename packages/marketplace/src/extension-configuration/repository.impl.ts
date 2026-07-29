/** Real, in-memory Extension Configuration repository. @module extension-configuration/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ExtensionConfigRepository } from './repository.js';
import type { ExtensionConfigEntry } from './types.js';

/** Creates a real, in-memory {@link ExtensionConfigRepository}. */
export function createExtensionConfigRepository(seed?: readonly ExtensionConfigEntry[]): ExtensionConfigRepository {
  const repo = createInMemoryRepository<ExtensionConfigEntry>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByExtension(organizationId, extensionId) {
      return repo.list(organizationId).filter((entry) => entry.extensionId === extensionId);
    },
  };
}
