/** @module agent/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type RuntimeAgentEventName =
  | DomainEventName<'runtime_agent', 'registered'>
  | DomainEventName<'runtime_agent', 'activated'>
  | DomainEventName<'runtime_agent', 'started'>
  | DomainEventName<'runtime_agent', 'paused'>
  | DomainEventName<'runtime_agent', 'resumed'>
  | DomainEventName<'runtime_agent', 'suspended'>
  | DomainEventName<'runtime_agent', 'terminated'>
  | DomainEventName<'runtime_agent', 'archived'>;

export type RuntimeAgentDomainEvent =
  | DomainEvent<'runtime_agent.registered', { readonly businessDnaAgentId: string }>
  | DomainEvent<'runtime_agent.activated', Record<string, unknown>>
  | DomainEvent<'runtime_agent.started', Record<string, unknown>>
  | DomainEvent<'runtime_agent.paused', Record<string, unknown>>
  | DomainEvent<'runtime_agent.resumed', Record<string, unknown>>
  | DomainEvent<'runtime_agent.suspended', Record<string, unknown>>
  | DomainEvent<'runtime_agent.terminated', Record<string, unknown>>
  | DomainEvent<'runtime_agent.archived', Record<string, unknown>>;
