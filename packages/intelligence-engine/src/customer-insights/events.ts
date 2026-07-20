/** @module customer-insights/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type CustomerInsightEventName =
  | DomainEventName<'customer_insight', 'discovered'>
  | DomainEventName<'customer_insight', 'updated'>
  | DomainEventName<'customer_insight', 'archived'>;

export type CustomerInsightDomainEvent =
  | DomainEvent<'customer_insight.discovered', { readonly title: string }>
  | DomainEvent<'customer_insight.updated', Record<string, unknown>>
  | DomainEvent<'customer_insight.archived', Record<string, unknown>>;
