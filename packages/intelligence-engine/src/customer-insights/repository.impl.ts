/** Real in-memory {@link CustomerInsightRepository} implementation. @module customer-insights/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { CustomerInsightId } from '../shared/identifiers.js';
import type { CustomerInsight } from './types.js';
import type { CustomerInsightRepository } from './repository.js';

export function createCustomerInsightRepository(seed?: readonly CustomerInsight[]): CustomerInsightRepository {
  const repo = createInMemoryRepository<CustomerInsight, CustomerInsightId>({ seed });
  return {
    ...repo,
    async findByCustomer(organizationId, customerId) {
      return repo.list(organizationId).filter((insight) => insight.customerId === customerId);
    },
  };
}
