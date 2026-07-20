/** @module ranking/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type RankingResultEventName =
  | DomainEventName<'ranking_result', 'computed'>
  | DomainEventName<'ranking_result', 'updated'>;

export type RankingResultDomainEvent =
  | DomainEvent<'ranking_result.computed', Record<string, unknown>>
  | DomainEvent<'ranking_result.updated', Record<string, unknown>>;
