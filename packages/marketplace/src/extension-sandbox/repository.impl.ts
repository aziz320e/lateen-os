/** Real, in-memory Sandbox Profile repository. @module extension-sandbox/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { SandboxProfileRepository } from './repository.js';
import type { SandboxProfile } from './types.js';

/** Creates a real, in-memory {@link SandboxProfileRepository}. */
export function createSandboxProfileRepository(seed?: readonly SandboxProfile[]): SandboxProfileRepository {
  const repo = createInMemoryRepository<SandboxProfile>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByExtension(organizationId, extensionId) {
      return repo.list(organizationId).find((profile) => profile.extensionId === extensionId) ?? null;
    },
  };
}
