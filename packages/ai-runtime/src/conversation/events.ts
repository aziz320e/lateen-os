/** @module conversation/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type ConversationEventName =
  | DomainEventName<'conversation', 'started'>
  | DomainEventName<'conversation', 'message_added'>
  | DomainEventName<'conversation', 'archived'>;

export type ConversationDomainEvent =
  | DomainEvent<'conversation.started', Record<string, unknown>>
  | DomainEvent<'conversation.message_added', Record<string, unknown>>
  | DomainEvent<'conversation.archived', Record<string, unknown>>;
