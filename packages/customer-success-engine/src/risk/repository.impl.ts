/** Real, in-memory Customer Risks repository. @module risk/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { CustomerRiskRepository } from './repository.js';
import type { CustomerRisk } from './types.js';

/** Creates a real, in-memory {@link CustomerRiskRepository}. */
export function createCustomerRiskRepository(seed?: readonly CustomerRisk[]): CustomerRiskRepository {
  const repo = createInMemoryRepository<CustomerRisk>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCustomer(organizationId, customerId) {
      return repo.list(organizationId).filter((risk) => risk.customerId === customerId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((risk) => risk.status === status);
    },
  };
}
