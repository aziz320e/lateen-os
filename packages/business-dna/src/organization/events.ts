/**
 * Organization domain events.
 *
 * @module organization/events
 */

import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { OrganizationStatus, ProductionModel } from './types.js';

export type OrganizationEventName =
  | DomainEventName<'organization', 'created'>
  | DomainEventName<'organization', 'activated'>
  | DomainEventName<'organization', 'suspended'>
  | DomainEventName<'organization', 'archived'>
  | DomainEventName<'organization', 'ai_policy_updated'>
  | DomainEventName<'organization', 'production_model_changed'>
  | DomainEventName<'organization', 'updated'>;

export interface OrganizationCreatedPayload {
  readonly code: string;
  readonly name: string;
}

export interface OrganizationStatusChangedPayload {
  readonly previousStatus: OrganizationStatus;
  readonly newStatus: OrganizationStatus;
}

export interface OrganizationProductionModelChangedPayload {
  readonly previousModel: ProductionModel;
  readonly newModel: ProductionModel;
}

export type OrganizationDomainEvent =
  | DomainEvent<'organization.created', OrganizationCreatedPayload>
  | DomainEvent<'organization.activated', OrganizationStatusChangedPayload>
  | DomainEvent<'organization.suspended', OrganizationStatusChangedPayload>
  | DomainEvent<'organization.archived', OrganizationStatusChangedPayload>
  | DomainEvent<'organization.ai_policy_updated', Record<string, unknown>>
  | DomainEvent<'organization.production_model_changed', OrganizationProductionModelChangedPayload>
  | DomainEvent<'organization.updated', Record<string, unknown>>;
