/** @module machine-discovery/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type MachineOpportunityEventName =
  | DomainEventName<'machine_opportunity', 'identified'>
  | DomainEventName<'machine_opportunity', 'recommended'>
  | DomainEventName<'machine_opportunity', 'rejected'>
  | DomainEventName<'machine_opportunity', 'archived'>;

export type MachineOpportunityDomainEvent =
  | DomainEvent<'machine_opportunity.identified', { readonly title: string }>
  | DomainEvent<'machine_opportunity.recommended', Record<string, unknown>>
  | DomainEvent<'machine_opportunity.rejected', Record<string, unknown>>
  | DomainEvent<'machine_opportunity.archived', Record<string, unknown>>;
