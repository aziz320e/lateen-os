/** @module invoice/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type InvoiceEventName =
  | DomainEventName<'invoice', 'created'>
  | DomainEventName<'invoice', 'issued'>
  | DomainEventName<'invoice', 'sent'>
  | DomainEventName<'invoice', 'payment_received'>
  | DomainEventName<'invoice', 'paid'>
  | DomainEventName<'invoice', 'overdue'>
  | DomainEventName<'invoice', 'voided'>
  | DomainEventName<'invoice', 'archived'>
  | DomainEventName<'invoice', 'updated'>;

export type InvoiceDomainEvent =
  | DomainEvent<'invoice.created', { readonly number: string }>
  | DomainEvent<'invoice.issued', Record<string, unknown>>
  | DomainEvent<'invoice.sent', Record<string, unknown>>
  | DomainEvent<'invoice.payment_received', { readonly amount: string }>
  | DomainEvent<'invoice.paid', Record<string, unknown>>
  | DomainEvent<'invoice.overdue', Record<string, unknown>>
  | DomainEvent<'invoice.voided', Record<string, unknown>>
  | DomainEvent<'invoice.archived', Record<string, unknown>>
  | DomainEvent<'invoice.updated', Record<string, unknown>>;
