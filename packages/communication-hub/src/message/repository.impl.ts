/** Real, in-memory {@link MessageRepository} implementation. @module message/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Message } from './types.js';
import type { MessageRepository } from './repository.js';

/** Creates a real, in-memory {@link MessageRepository}. */
export function createMessageRepository(seed?: readonly Message[]): MessageRepository {
  const repo = createInMemoryRepository<Message>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByConversation(organizationId, conversationId) {
      return repo.list(organizationId).filter((message) => message.conversationId === conversationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((message) => message.status === status);
    },
    async findByType(organizationId, messageType) {
      return repo.list(organizationId).filter((message) => message.messageType === messageType);
    },
  };
}
