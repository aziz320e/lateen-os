/** @module document/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type DocumentReferenceEventName =
  | DomainEventName<'document_reference', 'created'>
  | DomainEventName<'document_reference', 'archived'>
  | DomainEventName<'document_reference', 'superseded'>
  | DomainEventName<'document_reference', 'entity_linked'>
  | DomainEventName<'document_reference', 'updated'>;

export type DocumentReferenceDomainEvent =
  | DomainEvent<'document_reference.created', { readonly title: string }>
  | DomainEvent<'document_reference.archived', Record<string, unknown>>
  | DomainEvent<'document_reference.superseded', Record<string, unknown>>
  | DomainEvent<'document_reference.entity_linked', { readonly entityId: string }>
  | DomainEvent<'document_reference.updated', Record<string, unknown>>;
