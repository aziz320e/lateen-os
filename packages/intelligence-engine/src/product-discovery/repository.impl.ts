/** Real in-memory {@link ProductOpportunityRepository} implementation. @module product-discovery/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ProductOpportunityId } from '../shared/identifiers.js';
import type { ProductOpportunity } from './types.js';
import type { ProductOpportunityRepository } from './repository.js';

export function createProductOpportunityRepository(
  seed?: readonly ProductOpportunity[],
): ProductOpportunityRepository {
  const repo = createInMemoryRepository<ProductOpportunity, ProductOpportunityId>({ seed });
  return {
    ...repo,
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((opportunity) => opportunity.status === status);
    },
  };
}
