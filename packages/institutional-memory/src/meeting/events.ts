/** @module meeting/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type MeetingRecordEventName =
  | DomainEventName<'meeting_record', 'created'>
  | DomainEventName<'meeting_record', 'completed'>
  | DomainEventName<'meeting_record', 'cancelled'>
  | DomainEventName<'meeting_record', 'archived'>
  | DomainEventName<'meeting_record', 'action_item_added'>
  | DomainEventName<'meeting_record', 'decision_linked'>
  | DomainEventName<'meeting_record', 'updated'>;

export type MeetingRecordDomainEvent =
  | DomainEvent<'meeting_record.created', { readonly title: string }>
  | DomainEvent<'meeting_record.completed', Record<string, unknown>>
  | DomainEvent<'meeting_record.cancelled', Record<string, unknown>>
  | DomainEvent<'meeting_record.archived', Record<string, unknown>>
  | DomainEvent<'meeting_record.action_item_added', { readonly description: string }>
  | DomainEvent<'meeting_record.decision_linked', { readonly decisionId: string }>
  | DomainEvent<'meeting_record.updated', Record<string, unknown>>;
