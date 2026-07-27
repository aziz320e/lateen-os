/** @module events/governance-events */
import type { DomainEvent, DomainEventName } from '@lateen-os/shared-kernel/core';

export type PolicyCreatedEventName = DomainEventName<'policy', 'created'>;

export type PolicyCreatedEvent = DomainEvent<
  'policy.created',
  { readonly organizationId: string; readonly policyId: string; readonly policyType: string }
>;

export type PolicyUpdatedEvent = DomainEvent<'policy.updated', { readonly organizationId: string; readonly policyId: string }>;

export type PolicyActivatedEvent = DomainEvent<'policy.activated', { readonly organizationId: string; readonly policyId: string }>;

export type PolicyDeactivatedEvent = DomainEvent<'policy.deactivated', { readonly organizationId: string; readonly policyId: string }>;

export type ApprovalRequestedEvent = DomainEvent<
  'approval.requested',
  { readonly organizationId: string; readonly approvalRequestId: string; readonly category: string }
>;

export type ApprovalCompletedEvent = DomainEvent<
  'approval.completed',
  { readonly organizationId: string; readonly approvalRequestId: string; readonly outcome: string }
>;

export type RiskCreatedEvent = DomainEvent<
  'risk.created',
  { readonly organizationId: string; readonly riskId: string; readonly riskLevel: string }
>;

export type RiskEscalatedEvent = DomainEvent<'risk.escalated', { readonly organizationId: string; readonly riskId: string }>;

export type GovernanceViolationDetectedEvent = DomainEvent<
  'governance.violation.detected',
  { readonly organizationId: string; readonly ruleId: string; readonly appliesTo: string; readonly reason: string }
>;

export type GovernanceAuditCreatedEvent = DomainEvent<
  'governance.audit.created',
  { readonly organizationId: string; readonly decisionId: string; readonly decisionType: string }
>;

/** Canonical event names for external subscribers. */
export const GOVERNANCE_EVENT_NAMES = {
  PolicyCreated: 'policy.created',
  PolicyUpdated: 'policy.updated',
  PolicyActivated: 'policy.activated',
  PolicyDeactivated: 'policy.deactivated',
  ApprovalRequested: 'approval.requested',
  ApprovalCompleted: 'approval.completed',
  RiskCreated: 'risk.created',
  RiskEscalated: 'risk.escalated',
  GovernanceViolationDetected: 'governance.violation.detected',
  GovernanceAuditCreated: 'governance.audit.created',
} as const;

/** Union of all AI Governance Engine domain events. */
export type GovernanceDomainEvent =
  | PolicyCreatedEvent
  | PolicyUpdatedEvent
  | PolicyActivatedEvent
  | PolicyDeactivatedEvent
  | ApprovalRequestedEvent
  | ApprovalCompletedEvent
  | RiskCreatedEvent
  | RiskEscalatedEvent
  | GovernanceViolationDetectedEvent
  | GovernanceAuditCreatedEvent;
