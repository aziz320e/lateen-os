/**
 * Identifier types for the AI Compliance Engine bounded context.
 *
 * Where a sibling package already owns a canonical id (Organization,
 * Employee from Business DNA; IdentityId from AI Security Engine;
 * GovernancePolicyId from AI Governance Engine), it is reused directly
 * rather than redefined.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { EmployeeId, OrganizationId } from '@lateen-os/business-dna';
export type { IdentityId } from '@lateen-os/ai-security-engine';
export type { GovernancePolicyId } from '@lateen-os/ai-governance-engine';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Compliance Framework identifier. */
export type ComplianceFrameworkId = Identifier;

/** Compliance Framework version snapshot identifier. */
export type FrameworkVersionId = Identifier;

/** Compliance Control identifier. */
export type ComplianceControlId = Identifier;

/** Control Mapping identifier. */
export type ControlMappingId = Identifier;

/** Evidence record identifier. */
export type EvidenceRecordId = Identifier;

/** Evidence attachment identifier. */
export type EvidenceAttachmentId = Identifier;

/** Compliance Assessment identifier. */
export type ComplianceAssessmentId = Identifier;

/** Gap Analysis result identifier. */
export type GapAnalysisId = Identifier;

/** Remediation identifier. */
export type RemediationId = Identifier;

/** Compliance Audit identifier. */
export type ComplianceAuditId = Identifier;

/** Audit finding identifier. */
export type AuditFindingId = Identifier;

/** Retention rule identifier. */
export type ComplianceRetentionRuleId = Identifier;

/** Compliance Report identifier. */
export type ComplianceReportId = Identifier;
