/** @module decision/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type DecisionRecordEventName =
  | DomainEventName<'decision_record', 'created'>
  | DomainEventName<'decision_record', 'approved'>
  | DomainEventName<'decision_record', 'implemented'>
  | DomainEventName<'decision_record', 'reviewed'>
  | DomainEventName<'decision_record', 'superseded'>
  | DomainEventName<'decision_record', 'updated'>;

export type DecisionRecordDomainEvent =
  | DomainEvent<'decision_record.created', { readonly decision: string }>
  | DomainEvent<'decision_record.approved', Record<string, unknown>>
  | DomainEvent<'decision_record.implemented', Record<string, unknown>>
  | DomainEvent<'decision_record.reviewed', Record<string, unknown>>
  | DomainEvent<'decision_record.superseded', Record<string, unknown>>
  | DomainEvent<'decision_record.updated', Record<string, unknown>>;
