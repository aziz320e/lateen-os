/** Real, in-memory {@link ConversationRepository} implementation. @module conversation/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Conversation } from './types.js';
import type { ConversationRepository } from './repository.js';

/** Creates a real, in-memory {@link ConversationRepository}. */
export function createConversationRepository(seed?: readonly Conversation[]): ConversationRepository {
  const repo = createInMemoryRepository<Conversation>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((conversation) => conversation.status === status);
    },
    async findByType(organizationId, conversationType) {
      return repo.list(organizationId).filter((conversation) => conversation.conversationType === conversationType);
    },
  };
}
