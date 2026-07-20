/** @module asset/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type AssetEventName =
  | DomainEventName<'asset', 'created'>
  | DomainEventName<'asset', 'activated'>
  | DomainEventName<'asset', 'assigned'>
  | DomainEventName<'asset', 'unassigned'>
  | DomainEventName<'asset', 'maintenance_started'>
  | DomainEventName<'asset', 'maintenance_completed'>
  | DomainEventName<'asset', 'retired'>
  | DomainEventName<'asset', 'disposed'>
  | DomainEventName<'asset', 'archived'>
  | DomainEventName<'asset', 'updated'>;

export type AssetDomainEvent =
  | DomainEvent<'asset.created', { readonly code: string }>
  | DomainEvent<'asset.activated', Record<string, unknown>>
  | DomainEvent<'asset.assigned', { readonly employeeId?: string }>
  | DomainEvent<'asset.unassigned', Record<string, unknown>>
  | DomainEvent<'asset.maintenance_started', Record<string, unknown>>
  | DomainEvent<'asset.maintenance_completed', Record<string, unknown>>
  | DomainEvent<'asset.retired', Record<string, unknown>>
  | DomainEvent<'asset.disposed', Record<string, unknown>>
  | DomainEvent<'asset.archived', Record<string, unknown>>
  | DomainEvent<'asset.updated', Record<string, unknown>>;
