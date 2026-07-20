/** @module incident/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { IncidentSeverity } from './types.js';

export type IncidentRecordEventName =
  | DomainEventName<'incident_record', 'created'>
  | DomainEventName<'incident_record', 'investigating'>
  | DomainEventName<'incident_record', 'resolved'>
  | DomainEventName<'incident_record', 'closed'>
  | DomainEventName<'incident_record', 'archived'>
  | DomainEventName<'incident_record', 'updated'>;

export type IncidentRecordDomainEvent =
  | DomainEvent<'incident_record.created', { readonly title: string; readonly severity: IncidentSeverity }>
  | DomainEvent<'incident_record.investigating', Record<string, unknown>>
  | DomainEvent<'incident_record.resolved', Record<string, unknown>>
  | DomainEvent<'incident_record.closed', Record<string, unknown>>
  | DomainEvent<'incident_record.archived', Record<string, unknown>>
  | DomainEvent<'incident_record.updated', Record<string, unknown>>;
