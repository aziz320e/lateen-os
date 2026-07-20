/** @module permission/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type PermissionEventName =
  | DomainEventName<'permission', 'created'>
  | DomainEventName<'permission', 'activated'>
  | DomainEventName<'permission', 'deactivated'>
  | DomainEventName<'permission', 'archived'>
  | DomainEventName<'permission', 'updated'>;

export type PermissionDomainEvent =
  | DomainEvent<'permission.created', { readonly code: string }>
  | DomainEvent<'permission.activated', Record<string, unknown>>
  | DomainEvent<'permission.deactivated', Record<string, unknown>>
  | DomainEvent<'permission.archived', Record<string, unknown>>
  | DomainEvent<'permission.updated', Record<string, unknown>>;
