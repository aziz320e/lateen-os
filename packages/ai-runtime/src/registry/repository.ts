/** @module registry/repository */
import type { AgentId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { AgentRegistry } from './types.js';

export interface AgentRegistryRepository extends Repository<AgentRegistry, OrganizationId> {
  findByBusinessDnaAgentId(
    organizationId: OrganizationId,
    businessDnaAgentId: AgentId,
  ): Promise<AgentRegistry | null>;
}
