/** Real, in-memory {@link SalesOpportunityRepository} implementation. @module opportunity/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { SalesOpportunity } from './types.js';
import type { SalesOpportunityRepository } from './repository.js';

/** Creates a real, in-memory {@link SalesOpportunityRepository}. */
export function createSalesOpportunityRepository(seed?: readonly SalesOpportunity[]): SalesOpportunityRepository {
  const repo = createInMemoryRepository<SalesOpportunity>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStage(organizationId, stage) {
      return repo.list(organizationId).filter((opportunity) => opportunity.stage === stage);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((opportunity) => opportunity.status === status);
    },
    async findByCustomer(organizationId, customerId) {
      return repo.list(organizationId).filter((opportunity) => opportunity.customerId === customerId);
    },
  };
}
