/** @module product-capability/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { CapabilityId, ProductId } from '../shared/identifiers.js';

export type ProductCapabilityEventName =
  | DomainEventName<'product_capability', 'required'>
  | DomainEventName<'product_capability', 'removed'>
  | DomainEventName<'product_capability', 'activated'>
  | DomainEventName<'product_capability', 'deactivated'>
  | DomainEventName<'product_capability', 'updated'>;

export type ProductCapabilityDomainEvent =
  | DomainEvent<
      'product_capability.required',
      { readonly productId: ProductId; readonly capabilityId: CapabilityId }
    >
  | DomainEvent<
      'product_capability.removed',
      { readonly productId: ProductId; readonly capabilityId: CapabilityId }
    >
  | DomainEvent<'product_capability.activated', Record<string, unknown>>
  | DomainEvent<'product_capability.deactivated', Record<string, unknown>>
  | DomainEvent<'product_capability.updated', Record<string, unknown>>;
