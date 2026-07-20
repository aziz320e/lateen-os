/** @module supplier/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type SupplierEventName =
  | DomainEventName<'supplier', 'created'>
  | DomainEventName<'supplier', 'approved'>
  | DomainEventName<'supplier', 'activated'>
  | DomainEventName<'supplier', 'suspended'>
  | DomainEventName<'supplier', 'archived'>
  | DomainEventName<'supplier', 'updated'>;

export type SupplierDomainEvent =
  | DomainEvent<'supplier.created', { readonly code: string }>
  | DomainEvent<'supplier.approved', Record<string, unknown>>
  | DomainEvent<'supplier.activated', Record<string, unknown>>
  | DomainEvent<'supplier.suspended', Record<string, unknown>>
  | DomainEvent<'supplier.archived', Record<string, unknown>>
  | DomainEvent<'supplier.updated', Record<string, unknown>>;
