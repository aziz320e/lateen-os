/**
 * Real, in-memory {@link OrganizationRepository} implementation. Organization
 * is the tenant root, so it is scoped to itself: `getOrganizationId` reads
 * the entity's own `id`, meaning `findById(organizationId, id)` only ever
 * resolves when `organizationId === id`.
 *
 * @module organization/repository.impl
 */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Organization } from './types.js';
import type { OrganizationRepository } from './repository.js';

/** Creates a real, in-memory {@link OrganizationRepository}. */
export function createOrganizationRepository(seed?: readonly Organization[]): OrganizationRepository {
  const repo = createInMemoryRepository<Organization>({ seed, getOrganizationId: (org) => org.id });
  return {
    ...repo,
    async findByCode(code) {
      return repo.list().find((org) => org.code === code) ?? null;
    },
    async findByDomain(domain) {
      return repo.list().find((org) => org.domain === domain) ?? null;
    },
    async findByStatus(status) {
      return repo.list().filter((org) => org.status === status);
    },
    async findAll() {
      return repo.list();
    },
  };
}
