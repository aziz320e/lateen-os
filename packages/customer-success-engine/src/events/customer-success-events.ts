/** @module events/customer-success-events */
import type { DomainEvent } from '@lateen-os/shared-kernel/core';

export type CustomerOnboardedEvent = DomainEvent<
  'customer.onboarded',
  { readonly organizationId: string; readonly customerSuccessRecordId: string; readonly customerId: string }
>;

export type CustomerActivatedEvent = DomainEvent<
  'customer.activated',
  { readonly organizationId: string; readonly customerSuccessRecordId: string; readonly customerId: string }
>;

export type CustomerHealthUpdatedEvent = DomainEvent<
  'customer.health.updated',
  { readonly organizationId: string; readonly healthSnapshotId: string; readonly customerId: string; readonly overallScore: number; readonly tier: string }
>;

export type RenewalCreatedEvent = DomainEvent<
  'renewal.created',
  { readonly organizationId: string; readonly renewalId: string; readonly customerId: string; readonly renewalDate: string }
>;

export type RenewalCompletedEvent = DomainEvent<
  'renewal.completed',
  { readonly organizationId: string; readonly renewalId: string; readonly customerId: string; readonly outcome: string }
>;

export type CustomerChurnedEvent = DomainEvent<
  'customer.churned',
  { readonly organizationId: string; readonly customerSuccessRecordId: string; readonly customerId: string }
>;

export type CustomerReactivatedEvent = DomainEvent<
  'customer.reactivated',
  { readonly organizationId: string; readonly customerSuccessRecordId: string; readonly customerId: string }
>;

export type FeedbackReceivedEvent = DomainEvent<
  'feedback.received',
  { readonly organizationId: string; readonly feedbackEntryId: string; readonly customerId: string; readonly feedbackType: string }
>;

export type SuccessPlanCompletedEvent = DomainEvent<
  'successplan.completed',
  { readonly organizationId: string; readonly planId: string; readonly customerId: string }
>;

export type RiskDetectedEvent = DomainEvent<
  'risk.detected',
  { readonly organizationId: string; readonly riskId: string; readonly customerId: string; readonly score: number }
>;

/** Canonical event names for external subscribers. */
export const CUSTOMER_SUCCESS_EVENT_NAMES = {
  CustomerOnboarded: 'customer.onboarded',
  CustomerActivated: 'customer.activated',
  CustomerHealthUpdated: 'customer.health.updated',
  RenewalCreated: 'renewal.created',
  RenewalCompleted: 'renewal.completed',
  CustomerChurned: 'customer.churned',
  CustomerReactivated: 'customer.reactivated',
  FeedbackReceived: 'feedback.received',
  SuccessPlanCompleted: 'successplan.completed',
  RiskDetected: 'risk.detected',
} as const;

/** Union of all Customer Success Engine domain events. */
export type CustomerSuccessDomainEvent =
  | CustomerOnboardedEvent
  | CustomerActivatedEvent
  | CustomerHealthUpdatedEvent
  | RenewalCreatedEvent
  | RenewalCompletedEvent
  | CustomerChurnedEvent
  | CustomerReactivatedEvent
  | FeedbackReceivedEvent
  | SuccessPlanCompletedEvent
  | RiskDetectedEvent;
