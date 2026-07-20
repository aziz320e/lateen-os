/** @module employee/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { RoleId } from '../role/types.js';

export type EmployeeEventName =
  | DomainEventName<'employee', 'created'>
  | DomainEventName<'employee', 'activated'>
  | DomainEventName<'employee', 'on_leave'>
  | DomainEventName<'employee', 'returned'>
  | DomainEventName<'employee', 'suspended'>
  | DomainEventName<'employee', 'terminated'>
  | DomainEventName<'employee', 'archived'>
  | DomainEventName<'employee', 'role_assigned'>
  | DomainEventName<'employee', 'role_revoked'>
  | DomainEventName<'employee', 'updated'>;

export type EmployeeDomainEvent =
  | DomainEvent<'employee.created', { readonly employeeNumber: string }>
  | DomainEvent<'employee.activated', Record<string, unknown>>
  | DomainEvent<'employee.on_leave', Record<string, unknown>>
  | DomainEvent<'employee.returned', Record<string, unknown>>
  | DomainEvent<'employee.suspended', Record<string, unknown>>
  | DomainEvent<'employee.terminated', Record<string, unknown>>
  | DomainEvent<'employee.archived', Record<string, unknown>>
  | DomainEvent<'employee.role_assigned', { readonly roleId: RoleId }>
  | DomainEvent<'employee.role_revoked', { readonly roleId: RoleId }>
  | DomainEvent<'employee.updated', Record<string, unknown>>;
