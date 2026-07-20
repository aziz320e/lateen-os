/** @module product-discovery/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type ProductOpportunityEventName =
  | DomainEventName<'product_opportunity', 'identified'>
  | DomainEventName<'product_opportunity', 'evaluating'>
  | DomainEventName<'product_opportunity', 'approved'>
  | DomainEventName<'product_opportunity', 'rejected'>
  | DomainEventName<'product_opportunity', 'archived'>;

export type ProductOpportunityDomainEvent =
  | DomainEvent<'product_opportunity.identified', { readonly title: string }>
  | DomainEvent<'product_opportunity.evaluating', Record<string, unknown>>
  | DomainEvent<'product_opportunity.approved', Record<string, unknown>>
  | DomainEvent<'product_opportunity.rejected', Record<string, unknown>>
  | DomainEvent<'product_opportunity.archived', Record<string, unknown>>;
