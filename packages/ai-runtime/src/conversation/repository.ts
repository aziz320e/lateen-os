/** @module conversation/repository */
import type { ConversationId, OrganizationId, RuntimeAgentId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Conversation } from './types.js';

export interface ConversationRepository extends Repository<Conversation, ConversationId> {
  findByAgent(
    organizationId: OrganizationId,
    runtimeAgentId: RuntimeAgentId,
  ): Promise<readonly Conversation[]>;
}
