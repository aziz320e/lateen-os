/**
 * Real Conversation Engine — `create / archive / reopen / assign /
 * transfer / close`, built atop a guarded, deterministic status state
 * machine, over the 7 required deterministic conversation types.
 *
 * @module conversation/lifecycle.impl
 */
import type { CommunicationEventBus } from '../events/communication-event-bus.js';
import { ConversationNotFoundError, InvalidConversationTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ConversationId, OrganizationId } from '../shared/identifiers.js';
import type { CommunicationTag } from '../shared/primitives.js';
import type { ConversationRepository } from './repository.js';
import type { Conversation, ConversationStatus, ConversationType } from './types.js';

const CONVERSATION_TRANSITIONS: Readonly<Record<ConversationStatus, readonly ConversationStatus[]>> = {
  open: ['archived', 'closed'],
  archived: ['open'],
  closed: ['open'],
};

export function canTransitionConversation(from: ConversationStatus, to: ConversationStatus): boolean {
  return CONVERSATION_TRANSITIONS[from].includes(to);
}

export interface CreateConversationInput {
  readonly conversationType: ConversationType;
  readonly subject?: string;
  readonly tags?: readonly CommunicationTag[];
}

export interface ConversationLifecycle {
  create(organizationId: OrganizationId, input: CreateConversationInput): Promise<Conversation>;
  archive(organizationId: OrganizationId, conversationId: ConversationId): Promise<Conversation>;
  reopen(organizationId: OrganizationId, conversationId: ConversationId): Promise<Conversation>;
  /** Assigns an unassigned, open conversation to its first owner. */
  assign(organizationId: OrganizationId, conversationId: ConversationId, assigneeId: string): Promise<Conversation>;
  /** Reassigns an already-assigned, open conversation to a new owner, recording the prior owner. */
  transfer(organizationId: OrganizationId, conversationId: ConversationId, toAssigneeId: string): Promise<Conversation>;
  close(organizationId: OrganizationId, conversationId: ConversationId): Promise<Conversation>;
  get(organizationId: OrganizationId, conversationId: ConversationId): Promise<Conversation | null>;
}

/** Creates a real {@link ConversationLifecycle} backed by a {@link ConversationRepository}. */
export function createConversationLifecycle(
  repository: ConversationRepository,
  eventBus?: CommunicationEventBus,
  now: () => string = nowIso,
): ConversationLifecycle {
  async function requireConversation(organizationId: OrganizationId, conversationId: ConversationId): Promise<Conversation> {
    const conversation = await repository.findById(organizationId, conversationId);
    if (!conversation) throw new ConversationNotFoundError(conversationId);
    return conversation;
  }

  async function transition(organizationId: OrganizationId, conversationId: ConversationId, to: ConversationStatus): Promise<Conversation> {
    const conversation = await requireConversation(organizationId, conversationId);
    if (!canTransitionConversation(conversation.status, to)) {
      throw new InvalidConversationTransitionError(conversationId, conversation.status, to);
    }
    const updated: Conversation = { ...conversation, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const conversation: Conversation = {
        id: generateId('conversation'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        subject: input.subject,
        conversationType: input.conversationType,
        status: 'open',
        previousAssigneeIds: [],
        tags: input.tags ?? [],
      };
      await repository.save(conversation);
      eventBus?.publish('conversation.created', { conversationId: conversation.id, organizationId, conversationType: conversation.conversationType });
      return conversation;
    },

    async archive(organizationId, conversationId) {
      const archived = await transition(organizationId, conversationId, 'archived');
      const updated: Conversation = { ...archived, archivedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async reopen(organizationId, conversationId) {
      const reopened = await transition(organizationId, conversationId, 'open');
      const updated: Conversation = { ...reopened, archivedAt: undefined, closedAt: undefined };
      await repository.save(updated);
      return updated;
    },

    async assign(organizationId, conversationId, assigneeId) {
      const conversation = await requireConversation(organizationId, conversationId);
      if (conversation.status !== 'open' || conversation.assignedToId) {
        throw new InvalidConversationTransitionError(conversationId, conversation.status, 'assigned');
      }
      const updated: Conversation = { ...conversation, assignedToId: assigneeId, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async transfer(organizationId, conversationId, toAssigneeId) {
      const conversation = await requireConversation(organizationId, conversationId);
      if (conversation.status !== 'open' || !conversation.assignedToId) {
        throw new InvalidConversationTransitionError(conversationId, conversation.status, 'transferred');
      }
      const updated: Conversation = {
        ...conversation,
        assignedToId: toAssigneeId,
        previousAssigneeIds: [...conversation.previousAssigneeIds, conversation.assignedToId],
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async close(organizationId, conversationId) {
      const closed = await transition(organizationId, conversationId, 'closed');
      const updated: Conversation = { ...closed, closedAt: now() };
      await repository.save(updated);
      eventBus?.publish('conversation.closed', { conversationId, organizationId });
      return updated;
    },

    async get(organizationId, conversationId) {
      return repository.findById(organizationId, conversationId);
    },
  };
}
