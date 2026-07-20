/** @module template/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type TemplateEventName =
  | DomainEventName<'template', 'created'>
  | DomainEventName<'template', 'activated'>
  | DomainEventName<'template', 'archived'>
  | DomainEventName<'template', 'updated'>;

export type TemplateDomainEvent =
  | DomainEvent<'template.created', { readonly title: string }>
  | DomainEvent<'template.activated', Record<string, unknown>>
  | DomainEvent<'template.archived', Record<string, unknown>>
  | DomainEvent<'template.updated', Record<string, unknown>>;
