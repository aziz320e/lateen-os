/** @module playbook/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type PlaybookEventName =
  | DomainEventName<'playbook', 'created'>
  | DomainEventName<'playbook', 'activated'>
  | DomainEventName<'playbook', 'deprecated'>
  | DomainEventName<'playbook', 'archived'>
  | DomainEventName<'playbook', 'updated'>;

export type PlaybookDomainEvent =
  | DomainEvent<'playbook.created', { readonly title: string }>
  | DomainEvent<'playbook.activated', Record<string, unknown>>
  | DomainEvent<'playbook.deprecated', Record<string, unknown>>
  | DomainEvent<'playbook.archived', Record<string, unknown>>
  | DomainEvent<'playbook.updated', Record<string, unknown>>;
