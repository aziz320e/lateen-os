/** Real, in-memory Feature Flag repository. @module feature-flags/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { FeatureFlagRepository } from './repository.js';
import type { FeatureFlag } from './types.js';

/** Creates a real, in-memory {@link FeatureFlagRepository}. */
export function createFeatureFlagRepository(seed?: readonly FeatureFlag[]): FeatureFlagRepository {
  const repo = createInMemoryRepository<FeatureFlag>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByKey(organizationId, key) {
      return repo.list(organizationId).filter((flag) => flag.key === key);
    },
  };
}
