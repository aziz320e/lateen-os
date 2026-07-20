/** @module context/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type DecisionContextEventName =
  | DomainEventName<'decision_context', 'assembled'>
  | DomainEventName<'decision_context', 'updated'>;

export type DecisionContextDomainEvent =
  | DomainEvent<'decision_context.assembled', Record<string, unknown>>
  | DomainEvent<'decision_context.updated', Record<string, unknown>>;
