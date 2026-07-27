/** @module events/business-dna-events */
import type { DomainEvent, DomainEventName } from '@lateen-os/shared-kernel/core';

export type OrganizationLifecycleEventName =
  | DomainEventName<'organization', 'created'>
  | DomainEventName<'organization', 'updated'>
  | DomainEventName<'organization', 'archived'>
  | DomainEventName<'organization', 'restored'>
  | DomainEventName<'organization', 'activated'>
  | DomainEventName<'organization', 'suspended'>;

export type OrganizationLifecycleDomainEvent =
  | DomainEvent<'organization.created', { readonly code: string; readonly name: string }>
  | DomainEvent<'organization.updated', { readonly organizationId: string }>
  | DomainEvent<'organization.archived', { readonly organizationId: string }>
  | DomainEvent<'organization.restored', { readonly organizationId: string }>
  | DomainEvent<'organization.activated', { readonly organizationId: string }>
  | DomainEvent<'organization.suspended', { readonly organizationId: string }>;

export type BusinessProfileEventName = DomainEventName<'business-profile', 'updated'>;

export type BusinessProfileDomainEvent = DomainEvent<
  'business-profile.updated',
  { readonly organizationId: string }
>;

export type ProductEventName = DomainEventName<'product', 'created'> | DomainEventName<'product', 'updated'>;

export type ProductDomainEvent =
  | DomainEvent<'product.created', { readonly productId: string; readonly organizationId: string; readonly code: string }>
  | DomainEvent<'product.updated', { readonly productId: string; readonly organizationId: string }>;

export type CompetitorEventName = DomainEventName<'competitor', 'registered'>;

export type CompetitorDomainEvent = DomainEvent<
  'competitor.registered',
  { readonly competitorId: string; readonly organizationId: string; readonly name: string }
>;

export type PolicyEventName = DomainEventName<'policy', 'updated'>;

export type PolicyDomainEvent = DomainEvent<'policy.updated', { readonly policyId: string; readonly organizationId: string }>;

/** Canonical event names for external subscribers — the 8 required events, plus organization lifecycle extensions. */
export const BUSINESS_DNA_EVENT_NAMES = {
  OrganizationCreated: 'organization.created',
  OrganizationUpdated: 'organization.updated',
  OrganizationArchived: 'organization.archived',
  OrganizationRestored: 'organization.restored',
  OrganizationActivated: 'organization.activated',
  OrganizationSuspended: 'organization.suspended',
  BusinessProfileUpdated: 'business-profile.updated',
  ProductCreated: 'product.created',
  ProductUpdated: 'product.updated',
  CompetitorRegistered: 'competitor.registered',
  PolicyUpdated: 'policy.updated',
} as const;

/** Union of all Business DNA domain events. */
export type BusinessDnaDomainEvent =
  | OrganizationLifecycleDomainEvent
  | BusinessProfileDomainEvent
  | ProductDomainEvent
  | CompetitorDomainEvent
  | PolicyDomainEvent;
