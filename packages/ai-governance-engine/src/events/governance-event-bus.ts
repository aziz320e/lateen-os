/**
 * Real, typed event bus for the AI Governance Engine runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/governance-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type GovernanceEventMap = {
  'policy.created': { readonly organizationId: string; readonly policyId: string; readonly policyType: string };
  'policy.updated': { readonly organizationId: string; readonly policyId: string };
  'policy.activated': { readonly organizationId: string; readonly policyId: string };
  'policy.deactivated': { readonly organizationId: string; readonly policyId: string };
  'approval.requested': { readonly organizationId: string; readonly approvalRequestId: string; readonly category: string };
  'approval.completed': { readonly organizationId: string; readonly approvalRequestId: string; readonly outcome: string };
  'risk.created': { readonly organizationId: string; readonly riskId: string; readonly riskLevel: string };
  'risk.escalated': { readonly organizationId: string; readonly riskId: string };
  'governance.violation.detected': { readonly organizationId: string; readonly ruleId: string; readonly appliesTo: string; readonly reason: string };
  'governance.audit.created': { readonly organizationId: string; readonly decisionId: string; readonly decisionType: string };
};

export type GovernanceEventBus = EventBus<GovernanceEventMap>;

/** Creates an in-memory {@link GovernanceEventBus}. */
export function createGovernanceEventBus(): GovernanceEventBus {
  return createEventBus<GovernanceEventMap>();
}
