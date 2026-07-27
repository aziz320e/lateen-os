/** @module events/compliance-events */
import type { DomainEvent } from '@lateen-os/shared-kernel/core';

export type FrameworkCreatedEvent = DomainEvent<
  'framework.created',
  { readonly organizationId: string; readonly frameworkId: string; readonly frameworkCode: string }
>;

export type FrameworkUpdatedEvent = DomainEvent<'framework.updated', { readonly organizationId: string; readonly frameworkId: string }>;

export type AssessmentCompletedEvent = DomainEvent<
  'assessment.completed',
  { readonly organizationId: string; readonly assessmentId: string; readonly frameworkId: string; readonly status: string; readonly score: number }
>;

export type ControlFailedEvent = DomainEvent<
  'control.failed',
  { readonly organizationId: string; readonly controlId: string; readonly reason: string }
>;

export type ControlPassedEvent = DomainEvent<'control.passed', { readonly organizationId: string; readonly controlId: string }>;

export type EvidenceCollectedEvent = DomainEvent<
  'evidence.collected',
  { readonly organizationId: string; readonly evidenceId: string; readonly source: string }
>;

export type AuditStartedEvent = DomainEvent<'audit.started', { readonly organizationId: string; readonly auditId: string }>;

export type AuditCompletedEvent = DomainEvent<'audit.completed', { readonly organizationId: string; readonly auditId: string; readonly findingCount: number }>;

export type RemediationCreatedEvent = DomainEvent<
  'remediation.created',
  { readonly organizationId: string; readonly remediationId: string }
>;

export type RemediationCompletedEvent = DomainEvent<'remediation.completed', { readonly organizationId: string; readonly remediationId: string }>;

export type ComplianceReportGeneratedEvent = DomainEvent<
  'compliance.report.generated',
  { readonly organizationId: string; readonly reportId: string; readonly frameworkId: string; readonly score: number }
>;

/** Canonical event names for external subscribers. */
export const COMPLIANCE_EVENT_NAMES = {
  FrameworkCreated: 'framework.created',
  FrameworkUpdated: 'framework.updated',
  AssessmentCompleted: 'assessment.completed',
  ControlFailed: 'control.failed',
  ControlPassed: 'control.passed',
  EvidenceCollected: 'evidence.collected',
  AuditStarted: 'audit.started',
  AuditCompleted: 'audit.completed',
  RemediationCreated: 'remediation.created',
  RemediationCompleted: 'remediation.completed',
  ComplianceReportGenerated: 'compliance.report.generated',
} as const;

/** Union of all AI Compliance Engine domain events. */
export type ComplianceDomainEvent =
  | FrameworkCreatedEvent
  | FrameworkUpdatedEvent
  | AssessmentCompletedEvent
  | ControlFailedEvent
  | ControlPassedEvent
  | EvidenceCollectedEvent
  | AuditStartedEvent
  | AuditCompletedEvent
  | RemediationCreatedEvent
  | RemediationCompletedEvent
  | ComplianceReportGeneratedEvent;
