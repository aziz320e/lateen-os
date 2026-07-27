/** Real, in-memory {@link OpportunityRepository} implementation. @module opportunity/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Opportunity } from './types.js';
import type { OpportunityRepository } from './repository.js';

/** Creates a real, in-memory {@link OpportunityRepository}. */
export function createOpportunityRepository(seed?: readonly Opportunity[]): OpportunityRepository {
  const repo = createInMemoryRepository<Opportunity>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStage(organizationId, stage) {
      return repo.list(organizationId).filter((opportunity) => opportunity.stage === stage);
    },
    async findByAccount(organizationId, accountId) {
      return repo.list(organizationId).filter((opportunity) => opportunity.accountId === accountId);
    },
    async findByCustomer(organizationId, customerId) {
      return repo.list(organizationId).filter((opportunity) => opportunity.customerId === customerId);
    },
  };
}
