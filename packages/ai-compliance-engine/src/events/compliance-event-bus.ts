/**
 * Real, typed event bus for the AI Compliance Engine runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/compliance-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type ComplianceEventMap = {
  'framework.created': { readonly organizationId: string; readonly frameworkId: string; readonly frameworkCode: string };
  'framework.updated': { readonly organizationId: string; readonly frameworkId: string };
  'assessment.completed': { readonly organizationId: string; readonly assessmentId: string; readonly frameworkId: string; readonly status: string; readonly score: number };
  'control.failed': { readonly organizationId: string; readonly controlId: string; readonly reason: string };
  'control.passed': { readonly organizationId: string; readonly controlId: string };
  'evidence.collected': { readonly organizationId: string; readonly evidenceId: string; readonly source: string };
  'audit.started': { readonly organizationId: string; readonly auditId: string };
  'audit.completed': { readonly organizationId: string; readonly auditId: string; readonly findingCount: number };
  'remediation.created': { readonly organizationId: string; readonly remediationId: string };
  'remediation.completed': { readonly organizationId: string; readonly remediationId: string };
  'compliance.report.generated': { readonly organizationId: string; readonly reportId: string; readonly frameworkId: string; readonly score: number };
};

export type ComplianceEventBus = EventBus<ComplianceEventMap>;

/** Creates an in-memory {@link ComplianceEventBus}. */
export function createComplianceEventBus(): ComplianceEventBus {
  return createEventBus<ComplianceEventMap>();
}
