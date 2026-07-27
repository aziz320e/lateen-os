/** Real in-memory {@link WorkerRegistrationRepository} / {@link WorkerRegistryRepository} implementations. @module registry/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { WorkerRegistration, WorkerRegistry } from './types.js';
import type { WorkerRegistrationRepository, WorkerRegistryRepository } from './repository.js';

export function createWorkerRegistrationRepository(seed?: readonly WorkerRegistration[]): WorkerRegistrationRepository {
  const repo = createInMemoryRepository<WorkerRegistration>({ seed });
  return {
    ...repo,
    async findByWorkerId(organizationId, workerId) {
      return repo.list(organizationId).find((registration) => registration.workerId === workerId) ?? null;
    },
  };
}

export function createWorkerRegistryRepository(seed?: readonly WorkerRegistry[]): WorkerRegistryRepository {
  const store = new Map<string, WorkerRegistry>();
  for (const registry of seed ?? []) {
    store.set(registry.organizationId, registry);
  }
  return {
    async findByOrganization(organizationId) {
      return store.get(organizationId) ?? null;
    },
    async save(registry) {
      store.set(registry.organizationId, registry);
    },
  };
}
