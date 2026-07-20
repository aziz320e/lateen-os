/** @module opportunities/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type BusinessOpportunityEventName =
  | DomainEventName<'business_opportunity', 'identified'>
  | DomainEventName<'business_opportunity', 'qualified'>
  | DomainEventName<'business_opportunity', 'pursuing'>
  | DomainEventName<'business_opportunity', 'won'>
  | DomainEventName<'business_opportunity', 'lost'>
  | DomainEventName<'business_opportunity', 'archived'>;

export type BusinessOpportunityDomainEvent =
  | DomainEvent<'business_opportunity.identified', { readonly title: string }>
  | DomainEvent<'business_opportunity.qualified', Record<string, unknown>>
  | DomainEvent<'business_opportunity.pursuing', Record<string, unknown>>
  | DomainEvent<'business_opportunity.won', Record<string, unknown>>
  | DomainEvent<'business_opportunity.lost', Record<string, unknown>>
  | DomainEvent<'business_opportunity.archived', Record<string, unknown>>;
