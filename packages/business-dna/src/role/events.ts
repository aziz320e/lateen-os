/** @module role/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { PermissionId } from '../permission/types.js';

export type RoleEventName =
  | DomainEventName<'role', 'created'>
  | DomainEventName<'role', 'activated'>
  | DomainEventName<'role', 'deactivated'>
  | DomainEventName<'role', 'archived'>
  | DomainEventName<'role', 'permission_granted'>
  | DomainEventName<'role', 'permission_revoked'>
  | DomainEventName<'role', 'updated'>;

export type RoleDomainEvent =
  | DomainEvent<'role.created', { readonly code: string }>
  | DomainEvent<'role.activated', Record<string, unknown>>
  | DomainEvent<'role.deactivated', Record<string, unknown>>
  | DomainEvent<'role.archived', Record<string, unknown>>
  | DomainEvent<'role.permission_granted', { readonly permissionId: PermissionId }>
  | DomainEvent<'role.permission_revoked', { readonly permissionId: PermissionId }>
  | DomainEvent<'role.updated', Record<string, unknown>>;
