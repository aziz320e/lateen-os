/** @module service/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type ServiceEventName =
  | DomainEventName<'service', 'created'>
  | DomainEventName<'service', 'activated'>
  | DomainEventName<'service', 'discontinued'>
  | DomainEventName<'service', 'archived'>
  | DomainEventName<'service', 'price_changed'>
  | DomainEventName<'service', 'updated'>;

export type ServiceDomainEvent =
  | DomainEvent<'service.created', { readonly code: string }>
  | DomainEvent<'service.activated', Record<string, unknown>>
  | DomainEvent<'service.discontinued', Record<string, unknown>>
  | DomainEvent<'service.archived', Record<string, unknown>>
  | DomainEvent<'service.price_changed', Record<string, unknown>>
  | DomainEvent<'service.updated', Record<string, unknown>>;
