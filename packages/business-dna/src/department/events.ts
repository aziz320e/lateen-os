/** @module department/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type DepartmentEventName =
  | DomainEventName<'department', 'created'>
  | DomainEventName<'department', 'activated'>
  | DomainEventName<'department', 'deactivated'>
  | DomainEventName<'department', 'archived'>
  | DomainEventName<'department', 'restructured'>
  | DomainEventName<'department', 'updated'>;

export type DepartmentDomainEvent =
  | DomainEvent<'department.created', { readonly code: string }>
  | DomainEvent<'department.activated', Record<string, unknown>>
  | DomainEvent<'department.deactivated', Record<string, unknown>>
  | DomainEvent<'department.archived', Record<string, unknown>>
  | DomainEvent<'department.restructured', { readonly parentDepartmentId?: string }>
  | DomainEvent<'department.updated', Record<string, unknown>>;
