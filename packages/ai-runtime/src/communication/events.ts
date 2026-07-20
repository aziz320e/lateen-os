/** @module communication/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type AgentMessageEventName =
  | DomainEventName<'agent_message', 'sent'>
  | DomainEventName<'agent_message', 'delivered'>
  | DomainEventName<'agent_message', 'failed'>;

export type AgentMessageDomainEvent =
  | DomainEvent<'agent_message.sent', Record<string, unknown>>
  | DomainEvent<'agent_message.delivered', Record<string, unknown>>
  | DomainEvent<'agent_message.failed', Record<string, unknown>>;
