/** @module project/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type ProjectEventName =
  | DomainEventName<'project', 'created'>
  | DomainEventName<'project', 'planned'>
  | DomainEventName<'project', 'design_started'>
  | DomainEventName<'project', 'design_approved'>
  | DomainEventName<'project', 'production_started'>
  | DomainEventName<'project', 'production_completed'>
  | DomainEventName<'project', 'installation_started'>
  | DomainEventName<'project', 'site_installed'>
  | DomainEventName<'project', 'site_signed_off'>
  | DomainEventName<'project', 'phase_completed'>
  | DomainEventName<'project', 'on_hold'>
  | DomainEventName<'project', 'resumed'>
  | DomainEventName<'project', 'completed'>
  | DomainEventName<'project', 'cancelled'>
  | DomainEventName<'project', 'archived'>
  | DomainEventName<'project', 'risk_elevated'>
  | DomainEventName<'project', 'updated'>;

export type ProjectDomainEvent =
  | DomainEvent<'project.created', { readonly code: string }>
  | DomainEvent<'project.planned', Record<string, unknown>>
  | DomainEvent<'project.design_started', Record<string, unknown>>
  | DomainEvent<'project.design_approved', Record<string, unknown>>
  | DomainEvent<'project.production_started', Record<string, unknown>>
  | DomainEvent<'project.production_completed', Record<string, unknown>>
  | DomainEvent<'project.installation_started', Record<string, unknown>>
  | DomainEvent<'project.site_installed', { readonly siteId: string }>
  | DomainEvent<'project.site_signed_off', { readonly siteId: string }>
  | DomainEvent<'project.phase_completed', { readonly phaseNumber: number }>
  | DomainEvent<'project.on_hold', Record<string, unknown>>
  | DomainEvent<'project.resumed', Record<string, unknown>>
  | DomainEvent<'project.completed', Record<string, unknown>>
  | DomainEvent<'project.cancelled', Record<string, unknown>>
  | DomainEvent<'project.archived', Record<string, unknown>>
  | DomainEvent<'project.risk_elevated', Record<string, unknown>>
  | DomainEvent<'project.updated', Record<string, unknown>>;
