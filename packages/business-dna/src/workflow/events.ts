/** @module workflow/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type WorkflowEventName =
  | DomainEventName<'workflow', 'created'>
  | DomainEventName<'workflow', 'activated'>
  | DomainEventName<'workflow', 'deactivated'>
  | DomainEventName<'workflow', 'archived'>
  | DomainEventName<'workflow', 'version_published'>
  | DomainEventName<'workflow', 'instance_started'>
  | DomainEventName<'workflow', 'stage_completed'>
  | DomainEventName<'workflow', 'instance_completed'>
  | DomainEventName<'workflow', 'updated'>;

export type WorkflowDomainEvent =
  | DomainEvent<'workflow.created', { readonly code: string }>
  | DomainEvent<'workflow.activated', Record<string, unknown>>
  | DomainEvent<'workflow.deactivated', Record<string, unknown>>
  | DomainEvent<'workflow.archived', Record<string, unknown>>
  | DomainEvent<'workflow.version_published', { readonly version: number }>
  | DomainEvent<'workflow.instance_started', { readonly instanceId: string }>
  | DomainEvent<'workflow.stage_completed', { readonly stageId: string }>
  | DomainEvent<'workflow.instance_completed', { readonly instanceId: string }>
  | DomainEvent<'workflow.updated', Record<string, unknown>>;
