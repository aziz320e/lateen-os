/** @module execution/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { DecisionId } from '../shared/identifiers.js';

export type DecisionExecutionPlanEventName =
  | DomainEventName<'decision_execution_plan', 'created'>
  | DomainEventName<'decision_execution_plan', 'started'>
  | DomainEventName<'decision_execution_plan', 'step_completed'>
  | DomainEventName<'decision_execution_plan', 'completed'>
  | DomainEventName<'decision_execution_plan', 'failed'>
  | DomainEventName<'decision_execution_plan', 'rolled_back'>;

export type DecisionExecutionPlanDomainEvent =
  | DomainEvent<'decision_execution_plan.created', { readonly decisionId: DecisionId }>
  | DomainEvent<'decision_execution_plan.started', Record<string, unknown>>
  | DomainEvent<'decision_execution_plan.step_completed', { readonly stepId: string }>
  | DomainEvent<'decision_execution_plan.completed', Record<string, unknown>>
  | DomainEvent<'decision_execution_plan.failed', Record<string, unknown>>
  | DomainEvent<'decision_execution_plan.rolled_back', Record<string, unknown>>;
