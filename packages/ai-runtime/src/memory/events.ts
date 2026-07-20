/** @module memory/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type WorkingMemoryEventName =
  | DomainEventName<'working_memory', 'initialized'>
  | DomainEventName<'working_memory', 'reference_added'>
  | DomainEventName<'working_memory', 'cleared'>;

export type WorkingMemoryDomainEvent =
  | DomainEvent<'working_memory.initialized', Record<string, unknown>>
  | DomainEvent<'working_memory.reference_added', Record<string, unknown>>
  | DomainEvent<'working_memory.cleared', Record<string, unknown>>;
