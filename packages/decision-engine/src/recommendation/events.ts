/** @module recommendation/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { DecisionId } from '../shared/identifiers.js';

export type RecommendationEventName =
  | DomainEventName<'recommendation', 'proposed'>
  | DomainEventName<'recommendation', 'accepted'>
  | DomainEventName<'recommendation', 'rejected'>
  | DomainEventName<'recommendation', 'superseded'>
  | DomainEventName<'recommendation', 'updated'>;

export type RecommendationDomainEvent =
  | DomainEvent<'recommendation.proposed', { readonly decisionId: DecisionId }>
  | DomainEvent<'recommendation.accepted', Record<string, unknown>>
  | DomainEvent<'recommendation.rejected', Record<string, unknown>>
  | DomainEvent<'recommendation.superseded', Record<string, unknown>>
  | DomainEvent<'recommendation.updated', Record<string, unknown>>;
