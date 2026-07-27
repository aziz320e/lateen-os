/**
 * Real, typed event bus for the Communication Hub runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/communication-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type CommunicationEventMap = {
  'conversation.created': { readonly conversationId: string; readonly organizationId: string; readonly conversationType: string };
  'conversation.closed': { readonly conversationId: string; readonly organizationId: string };
  'participant.joined': { readonly participantId: string; readonly organizationId: string; readonly conversationId: string };
  'participant.left': { readonly participantId: string; readonly organizationId: string; readonly conversationId: string };
  'message.created': { readonly messageId: string; readonly organizationId: string; readonly conversationId: string };
  'message.sent': { readonly messageId: string; readonly organizationId: string };
  'message.delivered': { readonly messageId: string; readonly organizationId: string };
  'message.read': { readonly messageId: string; readonly organizationId: string };
  'notification.created': { readonly notificationId: string; readonly organizationId: string; readonly notificationType: string };
  'notification.sent': { readonly notificationId: string; readonly organizationId: string };
};

export type CommunicationEventBus = EventBus<CommunicationEventMap>;

/** Creates an in-memory {@link CommunicationEventBus}. */
export function createCommunicationEventBus(): CommunicationEventBus {
  return createEventBus<CommunicationEventMap>();
}
