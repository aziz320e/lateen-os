/** @module customer/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type CustomerEventName =
  | DomainEventName<'customer', 'created'>
  | DomainEventName<'customer', 'qualified'>
  | DomainEventName<'customer', 'activated'>
  | DomainEventName<'customer', 'on_hold'>
  | DomainEventName<'customer', 'released'>
  | DomainEventName<'customer', 'churned'>
  | DomainEventName<'customer', 'archived'>
  | DomainEventName<'customer', 'contract_signed'>
  | DomainEventName<'customer', 'contract_expiring'>
  | DomainEventName<'customer', 'contract_expired'>
  | DomainEventName<'customer', 'contract_renewed'>
  | DomainEventName<'customer', 'recurring_order_generated'>
  | DomainEventName<'customer', 'credit_limit_breached'>
  | DomainEventName<'customer', 'health_degraded'>
  | DomainEventName<'customer', 'updated'>;

export type CustomerDomainEvent =
  | DomainEvent<'customer.created', { readonly code: string }>
  | DomainEvent<'customer.qualified', Record<string, unknown>>
  | DomainEvent<'customer.activated', Record<string, unknown>>
  | DomainEvent<'customer.on_hold', Record<string, unknown>>
  | DomainEvent<'customer.released', Record<string, unknown>>
  | DomainEvent<'customer.churned', Record<string, unknown>>
  | DomainEvent<'customer.archived', Record<string, unknown>>
  | DomainEvent<'customer.contract_signed', { readonly contractReference?: string }>
  | DomainEvent<'customer.contract_expiring', Record<string, unknown>>
  | DomainEvent<'customer.contract_expired', Record<string, unknown>>
  | DomainEvent<'customer.contract_renewed', Record<string, unknown>>
  | DomainEvent<'customer.recurring_order_generated', { readonly scheduleId: string }>
  | DomainEvent<'customer.credit_limit_breached', Record<string, unknown>>
  | DomainEvent<'customer.health_degraded', Record<string, unknown>>
  | DomainEvent<'customer.updated', Record<string, unknown>>;
