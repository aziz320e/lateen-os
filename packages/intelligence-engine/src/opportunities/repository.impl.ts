/** Real in-memory {@link BusinessOpportunityRepository} implementation. @module opportunities/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { BusinessOpportunityId } from '../shared/identifiers.js';
import type { BusinessOpportunity } from './types.js';
import type { BusinessOpportunityRepository } from './repository.js';

export function createBusinessOpportunityRepository(
  seed?: readonly BusinessOpportunity[],
): BusinessOpportunityRepository {
  const repo = createInMemoryRepository<BusinessOpportunity, BusinessOpportunityId>({ seed });
  return {
    ...repo,
    async findByCategory(organizationId, category) {
      return repo.list(organizationId).filter((opportunity) => opportunity.category === category);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((opportunity) => opportunity.status === status);
    },
  };
}
