/** @module trend-discovery/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type TrendEventName =
  | DomainEventName<'trend', 'discovered'>
  | DomainEventName<'trend', 'updated'>
  | DomainEventName<'trend', 'peaking'>
  | DomainEventName<'trend', 'declining'>
  | DomainEventName<'trend', 'archived'>;

export type TrendDomainEvent =
  | DomainEvent<'trend.discovered', { readonly title: string }>
  | DomainEvent<'trend.updated', Record<string, unknown>>
  | DomainEvent<'trend.peaking', Record<string, unknown>>
  | DomainEvent<'trend.declining', Record<string, unknown>>
  | DomainEvent<'trend.archived', Record<string, unknown>>;
