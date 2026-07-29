/** Real, in-memory Package Version repository. @module package-registry/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { PackageVersionRepository } from './repository.js';
import type { PackageVersion } from './types.js';

/** Creates a real, in-memory {@link PackageVersionRepository}. */
export function createPackageVersionRepository(seed?: readonly PackageVersion[]): PackageVersionRepository {
  const repo = createInMemoryRepository<PackageVersion>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByExtensionKey(organizationId, extensionKey) {
      return repo.list(organizationId).filter((version) => version.extensionKey === extensionKey);
    },
    async findByExtensionKeyAndVersion(organizationId, extensionKey, version) {
      return repo.list(organizationId).find((entry) => entry.extensionKey === extensionKey && entry.version === version) ?? null;
    },
  };
}
