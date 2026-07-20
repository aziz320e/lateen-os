/** @module scheduler/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type ScheduleEventName =
  | DomainEventName<'schedule', 'created'>
  | DomainEventName<'schedule', 'triggered'>
  | DomainEventName<'schedule', 'cancelled'>;

export type ScheduleDomainEvent =
  | DomainEvent<'schedule.created', Record<string, unknown>>
  | DomainEvent<'schedule.triggered', Record<string, unknown>>
  | DomainEvent<'schedule.cancelled', Record<string, unknown>>;
