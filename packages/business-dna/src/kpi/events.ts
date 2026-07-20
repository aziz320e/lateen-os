/** @module kpi/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type KpiEventName =
  | DomainEventName<'kpi', 'created'>
  | DomainEventName<'kpi', 'activated'>
  | DomainEventName<'kpi', 'deactivated'>
  | DomainEventName<'kpi', 'archived'>
  | DomainEventName<'kpi', 'target_changed'>
  | DomainEventName<'kpi', 'measured'>
  | DomainEventName<'kpi', 'threshold_breached'>
  | DomainEventName<'kpi', 'updated'>;

export type KpiDomainEvent =
  | DomainEvent<'kpi.created', { readonly code: string }>
  | DomainEvent<'kpi.activated', Record<string, unknown>>
  | DomainEvent<'kpi.deactivated', Record<string, unknown>>
  | DomainEvent<'kpi.archived', Record<string, unknown>>
  | DomainEvent<'kpi.target_changed', Record<string, unknown>>
  | DomainEvent<'kpi.measured', { readonly value: string }>
  | DomainEvent<'kpi.threshold_breached', { readonly level: string }>
  | DomainEvent<'kpi.updated', Record<string, unknown>>;
