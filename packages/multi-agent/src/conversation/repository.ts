/** @module conversation/repository */
import type { Repository } from '../shared/repository.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
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

export interface ConversationRepository extends Repository<Conversation, CollaborationConversationId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<Conversation | null>;
}
export interface MessageRepository extends Repository<Message, CollaborationMessageId> {
  findByConversation(organizationId: OrganizationId, conversationId: CollaborationConversationId): Promise<readonly Message[]>;
}
export interface DiscussionRepository extends Repository<Discussion, DiscussionId> {
  findByConversation(organizationId: OrganizationId, conversationId: CollaborationConversationId): Promise<readonly Discussion[]>;
}
export interface DecisionProposalRepository extends Repository<DecisionProposal, DecisionProposalId> {
  findByConversation(organizationId: OrganizationId, conversationId: CollaborationConversationId): Promise<readonly DecisionProposal[]>;
  findByDiscussion(organizationId: OrganizationId, discussionId: DiscussionId): Promise<readonly DecisionProposal[]>;
}
