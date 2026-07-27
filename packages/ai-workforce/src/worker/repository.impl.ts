/** Real in-memory {@link WorkerRepository} implementation. @module worker/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AIWorker } from './types.js';
import type { WorkerRepository } from './repository.js';

/** Creates a real, in-memory {@link WorkerRepository}. */
export function createWorkerRepository(seed?: readonly AIWorker[]): WorkerRepository {
  const repo = createInMemoryRepository<AIWorker>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((worker) => worker.status === status);
    },
  };
}
