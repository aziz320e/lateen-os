/** @module scoring/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type IntelligenceScoreEventName =
  | DomainEventName<'intelligence_score', 'computed'>
  | DomainEventName<'intelligence_score', 'updated'>;

export type IntelligenceScoreDomainEvent =
  | DomainEvent<'intelligence_score.computed', Record<string, unknown>>
  | DomainEvent<'intelligence_score.updated', Record<string, unknown>>;
