/**
 * Real, typed event bus for the CRM Engine runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/crm-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type CrmEventMap = {
  'lead.created': { readonly leadId: string; readonly organizationId: string; readonly name: string };
  'lead.qualified': { readonly leadId: string; readonly organizationId: string };
  'lead.converted': { readonly leadId: string; readonly organizationId: string; readonly customerId: string };
  'customer.created': { readonly customerId: string; readonly organizationId: string; readonly name: string };
  'customer.updated': { readonly customerId: string; readonly organizationId: string };
  'opportunity.created': { readonly opportunityId: string; readonly organizationId: string; readonly name: string; readonly stage: string };
  'opportunity.won': { readonly opportunityId: string; readonly organizationId: string; readonly amount?: string };
  'opportunity.lost': { readonly opportunityId: string; readonly organizationId: string; readonly reason?: string };
  'activity.logged': { readonly activityId: string; readonly organizationId: string; readonly activityType: string };
};

export type CrmEventBus = EventBus<CrmEventMap>;

/** Creates an in-memory {@link CrmEventBus}. */
export function createCrmEventBus(): CrmEventBus {
  return createEventBus<CrmEventMap>();
}
