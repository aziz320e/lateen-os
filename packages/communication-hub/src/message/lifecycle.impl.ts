/**
 * Real Messaging service — deterministic messages across 8 required
 * types, moving through a guarded 7-state lifecycle, composed with the
 * Channel Registry for delivery.
 *
 * @module message/lifecycle.impl
 */
import type { ChannelRegistry, ChannelType } from '../channel/index.js';
import type { CommunicationEventBus } from '../events/communication-event-bus.js';
import { InvalidMessageTransitionError, MessageNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { AttachmentId } from '../attachment/types.js';
import type { ConversationId, MessageId, OrganizationId } from '../shared/identifiers.js';
import type { MessageRepository } from './repository.js';
import type { Message, MessageStatus, MessageType } from './types.js';

const MESSAGE_TRANSITIONS: Readonly<Record<MessageStatus, readonly MessageStatus[]>> = {
  draft: ['queued', 'sent', 'failed', 'archived'],
  queued: ['sent', 'failed', 'archived'],
  sent: ['delivered', 'failed', 'archived'],
  delivered: ['read', 'archived'],
  read: ['archived'],
  failed: ['archived'],
  archived: [],
};

export function canTransitionMessage(from: MessageStatus, to: MessageStatus): boolean {
  return MESSAGE_TRANSITIONS[from].includes(to);
}

/** The channel a message type is delivered through by default, when the caller doesn't specify one. */
const DEFAULT_CHANNEL_BY_MESSAGE_TYPE: Readonly<Record<MessageType, ChannelType>> = {
  text: 'internal_chat',
  email: 'email',
  sms: 'sms',
  whatsapp: 'whatsapp',
  system: 'internal_chat',
  workflow: 'internal_chat',
  ai: 'internal_chat',
  notification: 'internal_chat',
};

export interface CreateMessageInput {
  readonly conversationId: ConversationId;
  readonly messageType: MessageType;
  readonly senderParticipantId?: string;
  readonly recipient?: string;
  readonly body?: string;
  readonly attachmentIds?: readonly AttachmentId[];
}

export interface MessageLifecycle {
  create(organizationId: OrganizationId, input: CreateMessageInput): Promise<Message>;
  queue(organizationId: OrganizationId, messageId: MessageId): Promise<Message>;
  /** Sends the message through its default (or an explicitly given) channel. Transitions to `'sent'` or `'failed'` based on the channel's real delivery result. */
  send(organizationId: OrganizationId, messageId: MessageId, channelType?: ChannelType): Promise<Message>;
  deliver(organizationId: OrganizationId, messageId: MessageId): Promise<Message>;
  markRead(organizationId: OrganizationId, messageId: MessageId): Promise<Message>;
  fail(organizationId: OrganizationId, messageId: MessageId, reason?: string): Promise<Message>;
  archive(organizationId: OrganizationId, messageId: MessageId): Promise<Message>;
  get(organizationId: OrganizationId, messageId: MessageId): Promise<Message | null>;
  listByConversation(organizationId: OrganizationId, conversationId: ConversationId): Promise<readonly Message[]>;
}

/** Creates a real {@link MessageLifecycle} backed by a {@link MessageRepository} and the Channel Registry. */
export function createMessageLifecycle(
  repository: MessageRepository,
  channels: ChannelRegistry,
  eventBus?: CommunicationEventBus,
  now: () => string = nowIso,
): MessageLifecycle {
  async function requireMessage(organizationId: OrganizationId, messageId: MessageId): Promise<Message> {
    const message = await repository.findById(organizationId, messageId);
    if (!message) throw new MessageNotFoundError(messageId);
    return message;
  }

  async function transition(organizationId: OrganizationId, messageId: MessageId, to: MessageStatus): Promise<Message> {
    const message = await requireMessage(organizationId, messageId);
    if (!canTransitionMessage(message.status, to)) {
      throw new InvalidMessageTransitionError(messageId, message.status, to);
    }
    const updated: Message = { ...message, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const message: Message = {
        id: generateId('message'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        conversationId: input.conversationId,
        messageType: input.messageType,
        status: 'draft',
        senderParticipantId: input.senderParticipantId,
        recipient: input.recipient,
        body: input.body,
        attachmentIds: input.attachmentIds ?? [],
      };
      await repository.save(message);
      eventBus?.publish('message.created', { messageId: message.id, organizationId, conversationId: message.conversationId });
      return message;
    },

    async queue(organizationId, messageId) {
      return transition(organizationId, messageId, 'queued');
    },

    async send(organizationId, messageId, channelType) {
      const message = await requireMessage(organizationId, messageId);
      if (!canTransitionMessage(message.status, 'sent')) {
        throw new InvalidMessageTransitionError(messageId, message.status, 'sent');
      }
      const resolvedChannel = channelType ?? DEFAULT_CHANNEL_BY_MESSAGE_TYPE[message.messageType];
      const result = await channels.send(resolvedChannel, {
        organizationId,
        messageId,
        recipient: message.recipient,
        body: message.body,
      });

      if (result.status === 'failed') {
        const failed: Message = { ...message, status: 'failed', failedReason: result.errorMessage, updatedAt: now() };
        await repository.save(failed);
        return failed;
      }

      const sent: Message = {
        ...message,
        status: 'sent',
        providerMessageId: result.providerMessageId,
        sentAt: result.deliveredAt ?? now(),
        updatedAt: now(),
      };
      await repository.save(sent);
      eventBus?.publish('message.sent', { messageId, organizationId });
      return sent;
    },

    async deliver(organizationId, messageId) {
      const delivered = await transition(organizationId, messageId, 'delivered');
      const updated: Message = { ...delivered, deliveredAt: now() };
      await repository.save(updated);
      eventBus?.publish('message.delivered', { messageId, organizationId });
      return updated;
    },

    async markRead(organizationId, messageId) {
      const read = await transition(organizationId, messageId, 'read');
      const updated: Message = { ...read, readAt: now() };
      await repository.save(updated);
      eventBus?.publish('message.read', { messageId, organizationId });
      return updated;
    },

    async fail(organizationId, messageId, reason) {
      const failed = await transition(organizationId, messageId, 'failed');
      const updated: Message = { ...failed, failedReason: reason };
      await repository.save(updated);
      return updated;
    },

    async archive(organizationId, messageId) {
      return transition(organizationId, messageId, 'archived');
    },

    async get(organizationId, messageId) {
      return repository.findById(organizationId, messageId);
    },

    async listByConversation(organizationId, conversationId) {
      return repository.findByConversation(organizationId, conversationId);
    },
  };
}
