/** @module lesson/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type LessonLearnedEventName =
  | DomainEventName<'lesson_learned', 'created'>
  | DomainEventName<'lesson_learned', 'published'>
  | DomainEventName<'lesson_learned', 'archived'>
  | DomainEventName<'lesson_learned', 'updated'>;

export type LessonLearnedDomainEvent =
  | DomainEvent<'lesson_learned.created', { readonly title: string }>
  | DomainEvent<'lesson_learned.published', Record<string, unknown>>
  | DomainEvent<'lesson_learned.archived', Record<string, unknown>>
  | DomainEvent<'lesson_learned.updated', Record<string, unknown>>;
