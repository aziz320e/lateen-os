/** @module events/communication-events */
import type { DomainEvent, DomainEventName } from '@lateen-os/shared-kernel/core';

export type ConversationEventName = DomainEventName<'conversation', 'created'> | DomainEventName<'conversation', 'closed'>;

export type ConversationDomainEvent =
  | DomainEvent<'conversation.created', { readonly conversationId: string; readonly organizationId: string; readonly conversationType: string }>
  | DomainEvent<'conversation.closed', { readonly conversationId: string; readonly organizationId: string }>;

export type ParticipantEventName = DomainEventName<'participant', 'joined'> | DomainEventName<'participant', 'left'>;

export type ParticipantDomainEvent =
  | DomainEvent<'participant.joined', { readonly participantId: string; readonly organizationId: string; readonly conversationId: string }>
  | DomainEvent<'participant.left', { readonly participantId: string; readonly organizationId: string; readonly conversationId: string }>;

export type MessageEventName =
  | DomainEventName<'message', 'created'>
  | DomainEventName<'message', 'sent'>
  | DomainEventName<'message', 'delivered'>
  | DomainEventName<'message', 'read'>;

export type MessageDomainEvent =
  | DomainEvent<'message.created', { readonly messageId: string; readonly organizationId: string; readonly conversationId: string }>
  | DomainEvent<'message.sent', { readonly messageId: string; readonly organizationId: string }>
  | DomainEvent<'message.delivered', { readonly messageId: string; readonly organizationId: string }>
  | DomainEvent<'message.read', { readonly messageId: string; readonly organizationId: string }>;

export type NotificationEventName = DomainEventName<'notification', 'created'> | DomainEventName<'notification', 'sent'>;

export type NotificationDomainEvent =
  | DomainEvent<'notification.created', { readonly notificationId: string; readonly organizationId: string; readonly notificationType: string }>
  | DomainEvent<'notification.sent', { readonly notificationId: string; readonly organizationId: string }>;

/** Canonical event names for external subscribers. */
export const COMMUNICATION_EVENT_NAMES = {
  ConversationCreated: 'conversation.created',
  ConversationClosed: 'conversation.closed',
  ParticipantJoined: 'participant.joined',
  ParticipantLeft: 'participant.left',
  MessageCreated: 'message.created',
  MessageSent: 'message.sent',
  MessageDelivered: 'message.delivered',
  MessageRead: 'message.read',
  NotificationCreated: 'notification.created',
  NotificationSent: 'notification.sent',
} as const;

/** Union of all Communication Hub domain events. */
export type CommunicationDomainEvent = ConversationDomainEvent | ParticipantDomainEvent | MessageDomainEvent | NotificationDomainEvent;
