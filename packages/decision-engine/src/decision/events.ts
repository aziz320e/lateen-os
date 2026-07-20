/** @module decision/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { DecisionCategory } from './types.js';

export type DecisionEventName =
  | DomainEventName<'decision', 'created'>
  | DomainEventName<'decision', 'submitted'>
  | DomainEventName<'decision', 'evaluating'>
  | DomainEventName<'decision', 'pending_approval'>
  | DomainEventName<'decision', 'approved'>
  | DomainEventName<'decision', 'rejected'>
  | DomainEventName<'decision', 'escalated'>
  | DomainEventName<'decision', 'executing'>
  | DomainEventName<'decision', 'completed'>
  | DomainEventName<'decision', 'cancelled'>
  | DomainEventName<'decision', 'archived'>
  | DomainEventName<'decision', 'updated'>;

export type DecisionDomainEvent =
  | DomainEvent<'decision.created', { readonly title: string; readonly category: DecisionCategory }>
  | DomainEvent<'decision.submitted', Record<string, unknown>>
  | DomainEvent<'decision.evaluating', Record<string, unknown>>
  | DomainEvent<'decision.pending_approval', Record<string, unknown>>
  | DomainEvent<'decision.approved', Record<string, unknown>>
  | DomainEvent<'decision.rejected', Record<string, unknown>>
  | DomainEvent<'decision.escalated', Record<string, unknown>>
  | DomainEvent<'decision.executing', Record<string, unknown>>
  | DomainEvent<'decision.completed', Record<string, unknown>>
  | DomainEvent<'decision.cancelled', Record<string, unknown>>
  | DomainEvent<'decision.archived', Record<string, unknown>>
  | DomainEvent<'decision.updated', Record<string, unknown>>;
