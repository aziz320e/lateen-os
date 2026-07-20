/** @module policy/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type PolicyEventName =
  | DomainEventName<'policy', 'created'>
  | DomainEventName<'policy', 'approved'>
  | DomainEventName<'policy', 'activated'>
  | DomainEventName<'policy', 'suspended'>
  | DomainEventName<'policy', 'reactivated'>
  | DomainEventName<'policy', 'expired'>
  | DomainEventName<'policy', 'archived'>
  | DomainEventName<'policy', 'updated'>;

export type PolicyDomainEvent =
  | DomainEvent<'policy.created', { readonly code: string }>
  | DomainEvent<'policy.approved', Record<string, unknown>>
  | DomainEvent<'policy.activated', Record<string, unknown>>
  | DomainEvent<'policy.suspended', Record<string, unknown>>
  | DomainEvent<'policy.reactivated', Record<string, unknown>>
  | DomainEvent<'policy.expired', Record<string, unknown>>
  | DomainEvent<'policy.archived', Record<string, unknown>>
  | DomainEvent<'policy.updated', Record<string, unknown>>;
