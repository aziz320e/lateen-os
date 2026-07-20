/** @module research/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type ResearchRecordEventName =
  | DomainEventName<'research_record', 'created'>
  | DomainEventName<'research_record', 'completed'>
  | DomainEventName<'research_record', 'archived'>
  | DomainEventName<'research_record', 'updated'>;

export type ResearchRecordDomainEvent =
  | DomainEvent<'research_record.created', { readonly topic: string }>
  | DomainEvent<'research_record.completed', Record<string, unknown>>
  | DomainEvent<'research_record.archived', Record<string, unknown>>
  | DomainEvent<'research_record.updated', Record<string, unknown>>;
