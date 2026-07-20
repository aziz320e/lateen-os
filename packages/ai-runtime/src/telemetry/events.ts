/** @module telemetry/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type TelemetryEventName =
  | DomainEventName<'telemetry', 'recorded'>
  | DomainEventName<'trace', 'started'>
  | DomainEventName<'trace', 'completed'>;

export type TelemetryDomainEvent =
  | DomainEvent<'telemetry.recorded', Record<string, unknown>>
  | DomainEvent<'trace.started', Record<string, unknown>>
  | DomainEvent<'trace.completed', Record<string, unknown>>;
