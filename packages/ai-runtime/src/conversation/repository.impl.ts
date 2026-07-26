/** Real in-memory {@link ConversationRepository} implementation. @module conversation/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ConversationId } from '../shared/identifiers.js';
import type { Conversation } from './types.js';
import type { ConversationRepository } from './repository.js';

export function createConversationRepository(seed?: readonly Conversation[]): ConversationRepository {
  const repo = createInMemoryRepository<Conversation, ConversationId>({ seed });
  return {
    ...repo,
    async findByAgent(organizationId, runtimeAgentId) {
      return repo.list(organizationId).filter((conversation) => conversation.runtimeAgentId === runtimeAgentId);
    },
  };
}
