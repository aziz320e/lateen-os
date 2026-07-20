/** @module context/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type AgentContextEventName =
  | DomainEventName<'agent_context', 'assembled'>
  | DomainEventName<'agent_context', 'updated'>;

export type AgentContextDomainEvent =
  | DomainEvent<'agent_context.assembled', Record<string, unknown>>
  | DomainEvent<'agent_context.updated', Record<string, unknown>>;
