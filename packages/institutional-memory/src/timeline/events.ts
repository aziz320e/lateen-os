/** @module timeline/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type MemoryTimelineEventName =
  | DomainEventName<'memory_timeline', 'created'>
  | DomainEventName<'memory_timeline', 'event_appended'>
  | DomainEventName<'memory_timeline', 'updated'>;

export type TimelineEventEventName =
  | DomainEventName<'timeline_event', 'recorded'>;

export type MemoryTimelineDomainEvent =
  | DomainEvent<'memory_timeline.created', { readonly title: string }>
  | DomainEvent<'memory_timeline.event_appended', { readonly eventId: string }>
  | DomainEvent<'memory_timeline.updated', Record<string, unknown>>;

export type TimelineEventDomainEvent =
  | DomainEvent<'timeline_event.recorded', { readonly title: string }>;
