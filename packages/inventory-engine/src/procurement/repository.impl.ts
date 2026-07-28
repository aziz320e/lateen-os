/** Real, in-memory Procurement Preparation repository. @module procurement/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { PurchaseRequestRepository } from './repository.js';
import type { PurchaseRequest } from './types.js';

/** Creates a real, in-memory {@link PurchaseRequestRepository}. */
export function createPurchaseRequestRepository(seed?: readonly PurchaseRequest[]): PurchaseRequestRepository {
  const repo = createInMemoryRepository<PurchaseRequest>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((request) => request.status === status);
    },
  };
}
