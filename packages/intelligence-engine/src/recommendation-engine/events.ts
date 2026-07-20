/** @module recommendation-engine/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type RecommendationCandidateEventName =
  | DomainEventName<'recommendation_candidate', 'proposed'>
  | DomainEventName<'recommendation_candidate', 'ranked'>
  | DomainEventName<'recommendation_candidate', 'submitted'>
  | DomainEventName<'recommendation_candidate', 'archived'>;

export type RecommendationCandidateDomainEvent =
  | DomainEvent<'recommendation_candidate.proposed', { readonly title: string }>
  | DomainEvent<'recommendation_candidate.ranked', Record<string, unknown>>
  | DomainEvent<'recommendation_candidate.submitted', Record<string, unknown>>
  | DomainEvent<'recommendation_candidate.archived', Record<string, unknown>>;
