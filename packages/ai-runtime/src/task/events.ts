/** @module task/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type TaskEventName =
  | DomainEventName<'task', 'queued'>
  | DomainEventName<'task', 'assigned'>
  | DomainEventName<'task', 'started'>
  | DomainEventName<'task', 'completed'>
  | DomainEventName<'task', 'failed'>
  | DomainEventName<'task', 'cancelled'>;

export type TaskDomainEvent =
  | DomainEvent<'task.queued', { readonly title: string }>
  | DomainEvent<'task.assigned', Record<string, unknown>>
  | DomainEvent<'task.started', Record<string, unknown>>
  | DomainEvent<'task.completed', Record<string, unknown>>
  | DomainEvent<'task.failed', Record<string, unknown>>
  | DomainEvent<'task.cancelled', Record<string, unknown>>;
