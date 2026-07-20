/** @module permissions/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type RuntimePermissionEventName =
  | DomainEventName<'runtime_permission', 'granted'>
  | DomainEventName<'runtime_permission', 'revoked'>;

export type RuntimePermissionDomainEvent =
  | DomainEvent<'runtime_permission.granted', Record<string, unknown>>
  | DomainEvent<'runtime_permission.revoked', Record<string, unknown>>;
