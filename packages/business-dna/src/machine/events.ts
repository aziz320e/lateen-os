/** @module machine/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type MachineEventName =
  | DomainEventName<'machine', 'created'>
  | DomainEventName<'machine', 'activated'>
  | DomainEventName<'machine', 'job_started'>
  | DomainEventName<'machine', 'job_completed'>
  | DomainEventName<'machine', 'idle'>
  | DomainEventName<'machine', 'maintenance_started'>
  | DomainEventName<'machine', 'maintenance_completed'>
  | DomainEventName<'machine', 'error'>
  | DomainEventName<'machine', 'decommissioned'>
  | DomainEventName<'machine', 'archived'>
  | DomainEventName<'machine', 'utilization_reported'>
  | DomainEventName<'machine', 'updated'>;

export type MachineDomainEvent =
  | DomainEvent<'machine.created', { readonly code: string }>
  | DomainEvent<'machine.activated', Record<string, unknown>>
  | DomainEvent<'machine.job_started', { readonly jobId?: string }>
  | DomainEvent<'machine.job_completed', { readonly jobId?: string }>
  | DomainEvent<'machine.idle', Record<string, unknown>>
  | DomainEvent<'machine.maintenance_started', Record<string, unknown>>
  | DomainEvent<'machine.maintenance_completed', Record<string, unknown>>
  | DomainEvent<'machine.error', { readonly errorCode?: string }>
  | DomainEvent<'machine.decommissioned', Record<string, unknown>>
  | DomainEvent<'machine.archived', Record<string, unknown>>
  | DomainEvent<'machine.utilization_reported', Record<string, unknown>>
  | DomainEvent<'machine.updated', Record<string, unknown>>;
