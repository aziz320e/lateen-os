/** @module order/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type OrderEventName =
  | DomainEventName<'order', 'created'>
  | DomainEventName<'order', 'confirmed'>
  | DomainEventName<'order', 'fulfillment_started'>
  | DomainEventName<'order', 'partially_fulfilled'>
  | DomainEventName<'order', 'fulfilled'>
  | DomainEventName<'order', 'cancelled'>
  | DomainEventName<'order', 'archived'>
  | DomainEventName<'order', 'updated'>;

export type OrderDomainEvent =
  | DomainEvent<'order.created', { readonly number: string }>
  | DomainEvent<'order.confirmed', Record<string, unknown>>
  | DomainEvent<'order.fulfillment_started', Record<string, unknown>>
  | DomainEvent<'order.partially_fulfilled', Record<string, unknown>>
  | DomainEvent<'order.fulfilled', Record<string, unknown>>
  | DomainEvent<'order.cancelled', Record<string, unknown>>
  | DomainEvent<'order.archived', Record<string, unknown>>
  | DomainEvent<'order.updated', Record<string, unknown>>;
