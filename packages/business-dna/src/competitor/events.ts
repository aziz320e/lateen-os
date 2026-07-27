/** @module competitor/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type CompetitorEventName = DomainEventName<'competitor', 'registered'>;

export type CompetitorDomainEvent = DomainEvent<'competitor.registered', { readonly name: string }>;
