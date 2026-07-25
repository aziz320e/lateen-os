/** Real in-memory {@link MachineOpportunityRepository} implementation. @module machine-discovery/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { MachineOpportunityId } from '../shared/identifiers.js';
import type { MachineOpportunity } from './types.js';
import type { MachineOpportunityRepository } from './repository.js';

export function createMachineOpportunityRepository(
  seed?: readonly MachineOpportunity[],
): MachineOpportunityRepository {
  const repo = createInMemoryRepository<MachineOpportunity, MachineOpportunityId>({ seed });
  return {
    ...repo,
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((opportunity) => opportunity.status === status);
    },
  };
}
