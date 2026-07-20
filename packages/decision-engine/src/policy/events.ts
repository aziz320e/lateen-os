/** @module policy/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type DecisionPolicyEventName =
  | DomainEventName<'decision_policy', 'created'>
  | DomainEventName<'decision_policy', 'activated'>
  | DomainEventName<'decision_policy', 'suspended'>
  | DomainEventName<'decision_policy', 'archived'>
  | DomainEventName<'decision_policy', 'updated'>;

export type DecisionPolicyDomainEvent =
  | DomainEvent<'decision_policy.created', { readonly code: string }>
  | DomainEvent<'decision_policy.activated', Record<string, unknown>>
  | DomainEvent<'decision_policy.suspended', Record<string, unknown>>
  | DomainEvent<'decision_policy.archived', Record<string, unknown>>
  | DomainEvent<'decision_policy.updated', Record<string, unknown>>;
