/** Real, in-memory {@link ParticipantRepository} implementation. @module participant/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Participant } from './types.js';
import type { ParticipantRepository } from './repository.js';

/** Creates a real, in-memory {@link ParticipantRepository}. */
export function createParticipantRepository(seed?: readonly Participant[]): ParticipantRepository {
  const repo = createInMemoryRepository<Participant>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByConversation(organizationId, conversationId) {
      return repo.list(organizationId).filter((participant) => participant.conversationId === conversationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((participant) => participant.status === status);
    },
  };
}
