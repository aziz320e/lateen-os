/** @module capability/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type CapabilityEventName =
  | DomainEventName<'capability', 'created'>
  | DomainEventName<'capability', 'activated'>
  | DomainEventName<'capability', 'deactivated'>
  | DomainEventName<'capability', 'archived'>
  | DomainEventName<'capability', 'tag_added'>
  | DomainEventName<'capability', 'tag_removed'>
  | DomainEventName<'capability', 'updated'>;

export type CapabilityDomainEvent =
  | DomainEvent<'capability.created', { readonly code: string }>
  | DomainEvent<'capability.activated', Record<string, unknown>>
  | DomainEvent<'capability.deactivated', Record<string, unknown>>
  | DomainEvent<'capability.archived', Record<string, unknown>>
  | DomainEvent<'capability.tag_added', { readonly tag: string }>
  | DomainEvent<'capability.tag_removed', { readonly tag: string }>
  | DomainEvent<'capability.updated', Record<string, unknown>>;
