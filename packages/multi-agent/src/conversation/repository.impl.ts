/** Real in-memory conversation repository implementations. @module conversation/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Conversation, DecisionProposal, Discussion, Message } from './types.js';
import type {
  ConversationRepository,
  DecisionProposalRepository,
  DiscussionRepository,
  MessageRepository,
} from './repository.js';

export function createConversationRepository(seed?: readonly Conversation[]): ConversationRepository {
  const repo = createInMemoryRepository<Conversation>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).find((conversation) => conversation.missionId === missionId) ?? null;
    },
  };
}

export function createMessageRepository(seed?: readonly Message[]): MessageRepository {
  const repo = createInMemoryRepository<Message>({ seed });
  return {
    ...repo,
    async findByConversation(organizationId, conversationId) {
      return repo.list(organizationId).filter((message) => message.conversationId === conversationId);
    },
  };
}

export function createDiscussionRepository(seed?: readonly Discussion[]): DiscussionRepository {
  const repo = createInMemoryRepository<Discussion>({ seed });
  return {
    ...repo,
    async findByConversation(organizationId, conversationId) {
      return repo.list(organizationId).filter((discussion) => discussion.conversationId === conversationId);
    },
  };
}

export function createDecisionProposalRepository(seed?: readonly DecisionProposal[]): DecisionProposalRepository {
  const repo = createInMemoryRepository<DecisionProposal>({ seed });
  return {
    ...repo,
    async findByConversation(organizationId, conversationId) {
      return repo.list(organizationId).filter((proposal) => proposal.conversationId === conversationId);
    },
    async findByDiscussion(organizationId, discussionId) {
      return repo.list(organizationId).filter((proposal) => proposal.discussionId === discussionId);
    },
  };
}
