/** @module forecasting/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type ForecastEventName =
  | DomainEventName<'forecast', 'generated'>
  | DomainEventName<'forecast', 'published'>
  | DomainEventName<'forecast', 'superseded'>
  | DomainEventName<'forecast', 'archived'>;

export type ForecastDomainEvent =
  | DomainEvent<'forecast.generated', Record<string, unknown>>
  | DomainEvent<'forecast.published', Record<string, unknown>>
  | DomainEvent<'forecast.superseded', Record<string, unknown>>
  | DomainEvent<'forecast.archived', Record<string, unknown>>;
