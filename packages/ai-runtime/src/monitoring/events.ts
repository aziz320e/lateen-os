/** @module monitoring/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type HealthEventName =
  | DomainEventName<'runtime_health', 'checked'>
  | DomainEventName<'runtime_health', 'degraded'>;

export type HealthDomainEvent =
  | DomainEvent<'runtime_health.checked', Record<string, unknown>>
  | DomainEvent<'runtime_health.degraded', Record<string, unknown>>;
