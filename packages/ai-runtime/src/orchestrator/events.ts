/** @module orchestrator/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type OrchestrationEventName =
  | DomainEventName<'orchestration', 'started'>
  | DomainEventName<'orchestration', 'paused'>
  | DomainEventName<'orchestration', 'completed'>
  | DomainEventName<'orchestration', 'failed'>;

export type OrchestrationDomainEvent =
  | DomainEvent<'orchestration.started', Record<string, unknown>>
  | DomainEvent<'orchestration.paused', Record<string, unknown>>
  | DomainEvent<'orchestration.completed', Record<string, unknown>>
  | DomainEvent<'orchestration.failed', Record<string, unknown>>;
