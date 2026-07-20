/** @module conversation/repository */
import type { Repository } from '../shared/repository.js';
import type {
  CollaborationConversationId,
  CollaborationMessageId,
  Conversation,
  DecisionProposal,
  DecisionProposalId,
  Discussion,
  DiscussionId,
  Message,
} from './types.js';

export type ConversationRepository = Repository<Conversation, CollaborationConversationId>;
export type MessageRepository = Repository<Message, CollaborationMessageId>;
export type DiscussionRepository = Repository<Discussion, DiscussionId>;
export type DecisionProposalRepository = Repository<DecisionProposal, DecisionProposalId>;
