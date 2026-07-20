/** @module communication/repository */
import type { AgentMessageId, OrganizationId, RuntimeAgentId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { AgentMessage } from './types.js';

export interface AgentMessageRepository extends Repository<AgentMessage, AgentMessageId> {
  findByAgent(
    organizationId: OrganizationId,
    runtimeAgentId: RuntimeAgentId,
  ): Promise<readonly AgentMessage[]>;
}
