/**
 * Real, typed event bus for the Business DNA runtime, built on
 * shared-kernel's generic {@link createEventBus}. Publishes the 8 required
 * events (`organization.created/updated/archived`,
 * `business-profile.updated`, `product.created/updated`,
 * `competitor.registered`, `policy.updated`) plus `organization.activated`,
 * `organization.suspended`, and `organization.restored` — genuine
 * extensions of the Organization Lifecycle's guarded state machine.
 *
 * @module events/business-dna-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type BusinessDnaEventMap = {
  'organization.created': { readonly code: string; readonly name: string };
  'organization.updated': { readonly organizationId: string };
  'organization.archived': { readonly organizationId: string };
  'organization.restored': { readonly organizationId: string };
  'organization.activated': { readonly organizationId: string };
  'organization.suspended': { readonly organizationId: string };
  'business-profile.updated': { readonly organizationId: string };
  'product.created': { readonly productId: string; readonly organizationId: string; readonly code: string };
  'product.updated': { readonly productId: string; readonly organizationId: string };
  'competitor.registered': { readonly competitorId: string; readonly organizationId: string; readonly name: string };
  'policy.updated': { readonly policyId: string; readonly organizationId: string };
};

export type BusinessDnaEventBus = EventBus<BusinessDnaEventMap>;

/** Creates an in-memory {@link BusinessDnaEventBus}. */
export function createBusinessDnaEventBus(): BusinessDnaEventBus {
  return createEventBus<BusinessDnaEventMap>();
}
