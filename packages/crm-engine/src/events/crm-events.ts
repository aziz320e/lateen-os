/** @module events/crm-events */
import type { DomainEvent, DomainEventName } from '@lateen-os/shared-kernel/core';

export type LeadEventName =
  | DomainEventName<'lead', 'created'>
  | DomainEventName<'lead', 'qualified'>
  | DomainEventName<'lead', 'converted'>;

export type LeadDomainEvent =
  | DomainEvent<'lead.created', { readonly leadId: string; readonly organizationId: string; readonly name: string }>
  | DomainEvent<'lead.qualified', { readonly leadId: string; readonly organizationId: string }>
  | DomainEvent<'lead.converted', { readonly leadId: string; readonly organizationId: string; readonly customerId: string }>;

export type CustomerEventName = DomainEventName<'customer', 'created'> | DomainEventName<'customer', 'updated'>;

export type CustomerDomainEvent =
  | DomainEvent<'customer.created', { readonly customerId: string; readonly organizationId: string; readonly name: string }>
  | DomainEvent<'customer.updated', { readonly customerId: string; readonly organizationId: string }>;

export type OpportunityEventName =
  | DomainEventName<'opportunity', 'created'>
  | DomainEventName<'opportunity', 'won'>
  | DomainEventName<'opportunity', 'lost'>;

export type OpportunityDomainEvent =
  | DomainEvent<'opportunity.created', { readonly opportunityId: string; readonly organizationId: string; readonly name: string; readonly stage: string }>
  | DomainEvent<'opportunity.won', { readonly opportunityId: string; readonly organizationId: string; readonly amount?: string }>
  | DomainEvent<'opportunity.lost', { readonly opportunityId: string; readonly organizationId: string; readonly reason?: string }>;

export type ActivityEventName = DomainEventName<'activity', 'logged'>;

export type ActivityDomainEvent = DomainEvent<
  'activity.logged',
  { readonly activityId: string; readonly organizationId: string; readonly activityType: string }
>;

/** Canonical event names for external subscribers. */
export const CRM_EVENT_NAMES = {
  LeadCreated: 'lead.created',
  LeadQualified: 'lead.qualified',
  LeadConverted: 'lead.converted',
  CustomerCreated: 'customer.created',
  CustomerUpdated: 'customer.updated',
  OpportunityCreated: 'opportunity.created',
  OpportunityWon: 'opportunity.won',
  OpportunityLost: 'opportunity.lost',
  ActivityLogged: 'activity.logged',
} as const;

/** Union of all CRM Engine domain events. */
export type CrmDomainEvent = LeadDomainEvent | CustomerDomainEvent | OpportunityDomainEvent | ActivityDomainEvent;
