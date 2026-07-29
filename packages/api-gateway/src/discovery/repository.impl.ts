/** Real, in-memory Service Discovery repository. @module discovery/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ServiceRegistrationRepository } from './repository.js';
import type { ServiceRegistration } from './types.js';

/** Creates a real, in-memory {@link ServiceRegistrationRepository}. */
export function createServiceRegistrationRepository(seed?: readonly ServiceRegistration[]): ServiceRegistrationRepository {
  const repo = createInMemoryRepository<ServiceRegistration>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByServiceName(organizationId, serviceName) {
      return repo.list(organizationId).find((registration) => registration.serviceName === serviceName) ?? null;
    },
  };
}
