/** Real, in-memory {@link ObservabilitySnapshotRepository} implementation. @module snapshot/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ObservabilitySnapshotRepository } from './repository.js';
import type { ObservabilitySnapshot } from './types.js';

/** Creates a real, in-memory {@link ObservabilitySnapshotRepository}. */
export function createObservabilitySnapshotRepository(seed?: readonly ObservabilitySnapshot[]): ObservabilitySnapshotRepository {
  const repo = createInMemoryRepository<ObservabilitySnapshot>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCategory(organizationId, category) {
      return repo.list(organizationId).filter((snapshot) => snapshot.category === category);
    },
  };
}
