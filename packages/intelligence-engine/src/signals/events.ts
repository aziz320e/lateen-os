/** @module signals/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { SignalType } from './types.js';

export type SignalEventName =
  | DomainEventName<'signal', 'detected'>
  | DomainEventName<'signal', 'acknowledged'>
  | DomainEventName<'signal', 'resolved'>
  | DomainEventName<'signal', 'archived'>;

export type SignalDomainEvent =
  | DomainEvent<'signal.detected', { readonly type: SignalType; readonly title: string }>
  | DomainEvent<'signal.acknowledged', Record<string, unknown>>
  | DomainEvent<'signal.resolved', Record<string, unknown>>
  | DomainEvent<'signal.archived', Record<string, unknown>>;
