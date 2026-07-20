/** @module execution/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type ExecutionPlanEventName =
  | DomainEventName<'execution_plan', 'created'>
  | DomainEventName<'execution_plan', 'started'>
  | DomainEventName<'execution_plan', 'completed'>
  | DomainEventName<'execution_plan', 'failed'>;

export type ExecutionResultEventName =
  | DomainEventName<'execution_result', 'recorded'>;

export type ExecutionPlanDomainEvent =
  | DomainEvent<'execution_plan.created', Record<string, unknown>>
  | DomainEvent<'execution_plan.started', Record<string, unknown>>
  | DomainEvent<'execution_plan.completed', Record<string, unknown>>
  | DomainEvent<'execution_plan.failed', Record<string, unknown>>;

export type ExecutionResultDomainEvent =
  | DomainEvent<'execution_result.recorded', { readonly success: boolean }>;
