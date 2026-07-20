/** @module rule/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type DecisionRuleEventName =
  | DomainEventName<'decision_rule', 'created'>
  | DomainEventName<'decision_rule', 'activated'>
  | DomainEventName<'decision_rule', 'deactivated'>
  | DomainEventName<'decision_rule', 'archived'>
  | DomainEventName<'decision_rule', 'updated'>;

export type DecisionRuleDomainEvent =
  | DomainEvent<'decision_rule.created', { readonly code: string }>
  | DomainEvent<'decision_rule.activated', Record<string, unknown>>
  | DomainEvent<'decision_rule.deactivated', Record<string, unknown>>
  | DomainEvent<'decision_rule.archived', Record<string, unknown>>
  | DomainEvent<'decision_rule.updated', Record<string, unknown>>;
