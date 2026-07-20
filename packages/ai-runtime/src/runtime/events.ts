/** @module runtime/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type RuntimeSessionEventName =
  | DomainEventName<'runtime_session', 'started'>
  | DomainEventName<'runtime_session', 'state_changed'>
  | DomainEventName<'runtime_session', 'paused'>
  | DomainEventName<'runtime_session', 'resumed'>
  | DomainEventName<'runtime_session', 'terminated'>;

export type RuntimeSessionDomainEvent =
  | DomainEvent<'runtime_session.started', { readonly runtimeAgentId: string }>
  | DomainEvent<'runtime_session.state_changed', { readonly state: string }>
  | DomainEvent<'runtime_session.paused', Record<string, unknown>>
  | DomainEvent<'runtime_session.resumed', Record<string, unknown>>
  | DomainEvent<'runtime_session.terminated', Record<string, unknown>>;
