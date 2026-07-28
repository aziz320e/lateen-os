/** Real, in-memory Expansion repository. @module expansion/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ExpansionOpportunityRepository } from './repository.js';
import type { ExpansionOpportunity } from './types.js';

/** Creates a real, in-memory {@link ExpansionOpportunityRepository}. */
export function createExpansionOpportunityRepository(seed?: readonly ExpansionOpportunity[]): ExpansionOpportunityRepository {
  const repo = createInMemoryRepository<ExpansionOpportunity>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCustomer(organizationId, customerId) {
      return repo.list(organizationId).filter((opportunity) => opportunity.customerId === customerId);
    },
    async findByType(organizationId, opportunityType) {
      return repo.list(organizationId).filter((opportunity) => opportunity.opportunityType === opportunityType);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((opportunity) => opportunity.status === status);
    },
  };
}
