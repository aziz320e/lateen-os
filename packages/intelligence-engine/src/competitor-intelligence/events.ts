/** @module competitor-intelligence/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type CompetitorEventName =
  | DomainEventName<'competitor', 'tracked'>
  | DomainEventName<'competitor', 'threat_elevated'>
  | DomainEventName<'competitor', 'updated'>
  | DomainEventName<'competitor', 'archived'>;

export type CompetitorDomainEvent =
  | DomainEvent<'competitor.tracked', { readonly name: string }>
  | DomainEvent<'competitor.threat_elevated', Record<string, unknown>>
  | DomainEvent<'competitor.updated', Record<string, unknown>>
  | DomainEvent<'competitor.archived', Record<string, unknown>>;
