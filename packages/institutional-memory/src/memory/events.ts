/** @module memory/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type InstitutionalMemoryEventName =
  | DomainEventName<'institutional_memory', 'created'>
  | DomainEventName<'institutional_memory', 'activated'>
  | DomainEventName<'institutional_memory', 'archived'>
  | DomainEventName<'institutional_memory', 'superseded'>
  | DomainEventName<'institutional_memory', 'tag_added'>
  | DomainEventName<'institutional_memory', 'tag_removed'>
  | DomainEventName<'institutional_memory', 'updated'>;

export type InstitutionalMemoryDomainEvent =
  | DomainEvent<'institutional_memory.created', { readonly title: string }>
  | DomainEvent<'institutional_memory.activated', Record<string, unknown>>
  | DomainEvent<'institutional_memory.archived', Record<string, unknown>>
  | DomainEvent<'institutional_memory.superseded', Record<string, unknown>>
  | DomainEvent<'institutional_memory.tag_added', { readonly tag: string }>
  | DomainEvent<'institutional_memory.tag_removed', { readonly tag: string }>
  | DomainEvent<'institutional_memory.updated', Record<string, unknown>>;
