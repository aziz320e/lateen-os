/** @module market-research/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type MarketEventName =
  | DomainEventName<'market', 'researched'>
  | DomainEventName<'market', 'updated'>
  | DomainEventName<'market', 'archived'>;

export type MarketDomainEvent =
  | DomainEvent<'market.researched', { readonly name: string }>
  | DomainEvent<'market.updated', Record<string, unknown>>
  | DomainEvent<'market.archived', Record<string, unknown>>;
