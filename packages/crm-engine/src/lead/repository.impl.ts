/** Real, in-memory {@link LeadRepository} implementation. @module lead/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Lead } from './types.js';
import type { LeadRepository } from './repository.js';

/** Creates a real, in-memory {@link LeadRepository}. */
export function createLeadRepository(seed?: readonly Lead[]): LeadRepository {
  const repo = createInMemoryRepository<Lead>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((lead) => lead.status === status);
    },
    async findByEmail(organizationId, email) {
      return repo.list(organizationId).find((lead) => lead.email === email) ?? null;
    },
    async findByPhone(organizationId, phone) {
      return repo.list(organizationId).find((lead) => lead.phone === phone) ?? null;
    },
  };
}
