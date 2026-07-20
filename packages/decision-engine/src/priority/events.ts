/** @module priority/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { PriorityLevel } from './types.js';

export type PriorityScoreEventName =
  | DomainEventName<'priority_score', 'computed'>
  | DomainEventName<'priority_score', 'updated'>;

export type PriorityScoreDomainEvent =
  | DomainEvent<'priority_score.computed', { readonly level: PriorityLevel }>
  | DomainEvent<'priority_score.updated', Record<string, unknown>>;
