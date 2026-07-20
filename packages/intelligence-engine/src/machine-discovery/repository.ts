/** @module machine-discovery/repository */
import type { MachineOpportunityId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { MachineOpportunity, MachineOpportunityStatus } from './types.js';

export interface MachineOpportunityRepository extends Repository<
  MachineOpportunity,
  MachineOpportunityId
> {
  findByStatus(
    organizationId: OrganizationId,
    status: MachineOpportunityStatus,
  ): Promise<readonly MachineOpportunity[]>;
}
