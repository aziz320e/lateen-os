/**
 * Real, typed event bus for the Customer Success Engine runtime,
 * built on shared-kernel's generic {@link createEventBus}.
 *
 * @module events/customer-success-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type CustomerSuccessEventMap = {
  'customer.onboarded': { readonly organizationId: string; readonly customerSuccessRecordId: string; readonly customerId: string };
  'customer.activated': { readonly organizationId: string; readonly customerSuccessRecordId: string; readonly customerId: string };
  'customer.health.updated': { readonly organizationId: string; readonly healthSnapshotId: string; readonly customerId: string; readonly overallScore: number; readonly tier: string };
  'renewal.created': { readonly organizationId: string; readonly renewalId: string; readonly customerId: string; readonly renewalDate: string };
  'renewal.completed': { readonly organizationId: string; readonly renewalId: string; readonly customerId: string; readonly outcome: string };
  'customer.churned': { readonly organizationId: string; readonly customerSuccessRecordId: string; readonly customerId: string };
  'customer.reactivated': { readonly organizationId: string; readonly customerSuccessRecordId: string; readonly customerId: string };
  'feedback.received': { readonly organizationId: string; readonly feedbackEntryId: string; readonly customerId: string; readonly feedbackType: string };
  'successplan.completed': { readonly organizationId: string; readonly planId: string; readonly customerId: string };
  'risk.detected': { readonly organizationId: string; readonly riskId: string; readonly customerId: string; readonly score: number };
};

export type CustomerSuccessEventBus = EventBus<CustomerSuccessEventMap>;

/** Creates an in-memory {@link CustomerSuccessEventBus}. */
export function createCustomerSuccessEventBus(): CustomerSuccessEventBus {
  return createEventBus<CustomerSuccessEventMap>();
}
