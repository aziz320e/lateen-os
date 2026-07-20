/** @module agent/repository */
import type { AgentId, OrganizationId, RuntimeAgentId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Agent, AgentStatus } from './types.js';

export interface AgentRepository extends Repository<Agent, RuntimeAgentId> {
  findByBusinessDnaAgentId(
    organizationId: OrganizationId,
    businessDnaAgentId: AgentId,
  ): Promise<Agent | null>;
  findByStatus(
    organizationId: OrganizationId,
    status: AgentStatus,
  ): Promise<readonly Agent[]>;
}
