/** @module evaluation/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { DecisionId } from '../shared/identifiers.js';

export type EvaluationResultEventName =
  | DomainEventName<'evaluation_result', 'created'>
  | DomainEventName<'evaluation_result', 'passed'>
  | DomainEventName<'evaluation_result', 'failed'>
  | DomainEventName<'evaluation_result', 'updated'>;

export type EvaluationResultDomainEvent =
  | DomainEvent<'evaluation_result.created', { readonly decisionId: DecisionId }>
  | DomainEvent<'evaluation_result.passed', Record<string, unknown>>
  | DomainEvent<'evaluation_result.failed', Record<string, unknown>>
  | DomainEvent<'evaluation_result.updated', Record<string, unknown>>;
