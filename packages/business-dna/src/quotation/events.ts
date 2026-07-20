/** @module quotation/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type QuotationEventName =
  | DomainEventName<'quotation', 'created'>
  | DomainEventName<'quotation', 'sent'>
  | DomainEventName<'quotation', 'accepted'>
  | DomainEventName<'quotation', 'rejected'>
  | DomainEventName<'quotation', 'expired'>
  | DomainEventName<'quotation', 'cancelled'>
  | DomainEventName<'quotation', 'converted'>
  | DomainEventName<'quotation', 'archived'>
  | DomainEventName<'quotation', 'updated'>;

export type QuotationDomainEvent =
  | DomainEvent<'quotation.created', { readonly number: string }>
  | DomainEvent<'quotation.sent', Record<string, unknown>>
  | DomainEvent<'quotation.accepted', Record<string, unknown>>
  | DomainEvent<'quotation.rejected', Record<string, unknown>>
  | DomainEvent<'quotation.expired', Record<string, unknown>>
  | DomainEvent<'quotation.cancelled', Record<string, unknown>>
  | DomainEvent<'quotation.converted', { readonly orderId?: string }>
  | DomainEvent<'quotation.archived', Record<string, unknown>>
  | DomainEvent<'quotation.updated', Record<string, unknown>>;
