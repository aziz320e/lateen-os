/** @module knowledge/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { KnowledgeType } from './types.js';

export type KnowledgeEntryEventName =
  | DomainEventName<'knowledge_entry', 'created'>
  | DomainEventName<'knowledge_entry', 'published'>
  | DomainEventName<'knowledge_entry', 'review_requested'>
  | DomainEventName<'knowledge_entry', 'archived'>
  | DomainEventName<'knowledge_entry', 'updated'>;

export type KnowledgeEntryDomainEvent =
  | DomainEvent<'knowledge_entry.created', { readonly title: string; readonly knowledgeType: KnowledgeType }>
  | DomainEvent<'knowledge_entry.published', Record<string, unknown>>
  | DomainEvent<'knowledge_entry.review_requested', Record<string, unknown>>
  | DomainEvent<'knowledge_entry.archived', Record<string, unknown>>
  | DomainEvent<'knowledge_entry.updated', Record<string, unknown>>;
