/**
 * Real Agent Communication Bus + Message Routing. The bus persists
 * conversations/messages/discussions/proposals; the router deterministically
 * decides who receives a sent message and, when an event bus is injected,
 * publishes a real per-recipient routing event.
 *
 * @module conversation/bus.impl
 */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { CollaborationEventBus } from '../events/collaboration-event-bus.js';
import { NotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type {
  ConversationRepository,
  DecisionProposalRepository,
  DiscussionRepository,
  MessageRepository,
} from './repository.js';
import type {
  CollaborationConversationId,
  Conversation,
  DecisionProposal,
  Discussion,
  DiscussionId,
  Message,
  MessageType,
} from './types.js';

export interface SendMessageInput {
  readonly organizationId: OrganizationId;
  readonly conversationId: CollaborationConversationId;
  readonly authorWorkerId: WorkerId;
  readonly type: MessageType;
  readonly content: string;
  readonly replyToMessageId?: string;
}

export interface RoutedMessage {
  readonly message: Message;
  /** Real Message Routing decision — every other active participant in the conversation. */
  readonly recipientWorkerIds: readonly WorkerId[];
}

export interface CreateProposalInput {
  readonly organizationId: OrganizationId;
  readonly conversationId: CollaborationConversationId;
  readonly discussionId?: DiscussionId;
  readonly proposerWorkerId: WorkerId;
  readonly title: string;
  readonly rationale: string;
  readonly proposedAction: string;
}

export interface CommunicationBus {
  createConversation(organizationId: OrganizationId, missionId: MissionId, title: string, participantWorkerIds: readonly WorkerId[]): Promise<Conversation>;
  addParticipant(organizationId: OrganizationId, conversationId: CollaborationConversationId, workerId: WorkerId): Promise<Conversation>;
  openDiscussion(organizationId: OrganizationId, conversationId: CollaborationConversationId, topic: string, participantWorkerIds: readonly WorkerId[]): Promise<Discussion>;
  send(input: SendMessageInput): Promise<RoutedMessage>;
  propose(input: CreateProposalInput): Promise<DecisionProposal>;
  history(organizationId: OrganizationId, conversationId: CollaborationConversationId): Promise<readonly Message[]>;
}

/** Creates a real {@link CommunicationBus}. */
export function createCommunicationBus(
  conversationRepository: ConversationRepository,
  messageRepository: MessageRepository,
  discussionRepository: DiscussionRepository,
  proposalRepository: DecisionProposalRepository,
  eventBus?: CollaborationEventBus,
): CommunicationBus {
  async function requireConversation(organizationId: OrganizationId, conversationId: CollaborationConversationId): Promise<Conversation> {
    const conversation = await conversationRepository.findById(organizationId, conversationId);
    if (!conversation) throw new NotFoundError('Conversation', conversationId);
    return conversation;
  }

  return {
    async createConversation(organizationId, missionId, title, participantWorkerIds) {
      const now = nowIso();
      const conversation: Conversation = {
        id: generateId('conversation'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        missionId,
        title,
        participantWorkerIds,
        discussionIds: [],
        active: true,
      };
      await conversationRepository.save(conversation);
      return conversation;
    },

    async addParticipant(organizationId, conversationId, workerId) {
      const conversation = await requireConversation(organizationId, conversationId);
      if (conversation.participantWorkerIds.includes(workerId)) return conversation;
      const updated: Conversation = {
        ...conversation,
        participantWorkerIds: [...conversation.participantWorkerIds, workerId],
        updatedAt: nowIso(),
      };
      await conversationRepository.save(updated);
      return updated;
    },

    async openDiscussion(organizationId, conversationId, topic, participantWorkerIds) {
      const conversation = await requireConversation(organizationId, conversationId);
      const now = nowIso();
      const discussion: Discussion = {
        id: generateId('discussion'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        conversationId,
        topic,
        status: 'open',
        messageIds: [],
        participantWorkerIds,
      };
      await discussionRepository.save(discussion);
      await conversationRepository.save({
        ...conversation,
        discussionIds: [...conversation.discussionIds, discussion.id],
        updatedAt: now,
      });
      return discussion;
    },

    async send(input) {
      const conversation = await requireConversation(input.organizationId, input.conversationId);
      const now = nowIso();
      const message: Message = {
        id: generateId('message'),
        organizationId: input.organizationId,
        createdAt: now,
        updatedAt: now,
        conversationId: input.conversationId,
        authorWorkerId: input.authorWorkerId,
        type: input.type,
        content: input.content,
        sentAt: now,
        replyToMessageId: input.replyToMessageId,
      };
      await messageRepository.save(message);

      // Real Message Routing: broadcast to every other active participant.
      const recipientWorkerIds = conversation.participantWorkerIds.filter((workerId) => workerId !== input.authorWorkerId);
      eventBus?.publish('message.routed', {
        messageId: message.id,
        conversationId: input.conversationId,
        recipientCount: recipientWorkerIds.length,
      });

      return { message, recipientWorkerIds };
    },

    async propose(input) {
      const now = nowIso();
      const proposal: DecisionProposal = {
        id: generateId('decision-proposal'),
        organizationId: input.organizationId,
        createdAt: now,
        updatedAt: now,
        conversationId: input.conversationId,
        discussionId: input.discussionId,
        proposerWorkerId: input.proposerWorkerId,
        title: input.title,
        rationale: input.rationale,
        proposedAction: input.proposedAction,
        status: 'submitted',
      };
      await proposalRepository.save(proposal);
      return proposal;
    },

    async history(organizationId, conversationId) {
      return messageRepository.findByConversation(organizationId, conversationId);
    },
  };
}
