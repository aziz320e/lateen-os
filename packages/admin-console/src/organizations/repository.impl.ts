/** Real, in-memory, platform-wide Organization repository. @module organizations/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { OrganizationRepository } from './repository.js';
import type { Organization } from './types.js';

/** Creates a real, in-memory {@link OrganizationRepository}. */
export function createOrganizationRepository(seed?: readonly Organization[]): OrganizationRepository {
  const repo = createInMemoryRepository<Organization>({ seed });
  return {
    async findById(organizationId, id) {
      return repo.findById(organizationId, id);
    },
    async save(entity) {
      await repo.save(entity);
    },
    async delete(organizationId, id) {
      await repo.delete(organizationId, id);
    },
    async findAll() {
      return repo.list();
    },
  };
}
