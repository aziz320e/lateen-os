/** Real, in-memory Tenant/Environment repositories. @module tenants/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { EnvironmentRepository, TenantRepository } from './repository.js';
import type { Environment, Tenant } from './types.js';

/** Creates a real, in-memory {@link TenantRepository}. */
export function createTenantRepository(seed?: readonly Tenant[]): TenantRepository {
  const repo = createInMemoryRepository<Tenant>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link EnvironmentRepository}. */
export function createEnvironmentRepository(seed?: readonly Environment[]): EnvironmentRepository {
  const repo = createInMemoryRepository<Environment>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByTenant(organizationId, tenantId) {
      return repo.list(organizationId).filter((environment) => environment.tenantId === tenantId);
    },
  };
}
