/** @module framework/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ComplianceFrameworkId, FrameworkVersionId } from '../shared/identifiers.js';

export type { ComplianceFrameworkId, FrameworkVersionId };

/** The eight compliance frameworks supported by the registry. */
export type ComplianceFrameworkCode = 'GDPR' | 'ISO27001' | 'SOC2' | 'HIPAA' | 'PCI_DSS' | 'NIST_CSF' | 'ISO42001' | 'EU_AI_ACT';

export type ComplianceControlType = 'administrative' | 'technical' | 'operational' | 'physical';

export type ComplianceFrameworkStatus = 'draft' | 'active' | 'inactive' | 'archived';

/** A single compliance framework registration — its current, mutable state. */
export interface ComplianceFramework extends TenantAuditableEntity<ComplianceFrameworkId> {
  readonly frameworkCode: ComplianceFrameworkCode;
  readonly name: string;
  readonly description?: string;
  /** Control types this framework requires at least one approved, implemented control of — drives Gap Analysis's "missing controls" check. Defaults to all four when omitted. */
  readonly requiredControlTypes: readonly ComplianceControlType[];
  readonly status: ComplianceFrameworkStatus;
  /** Stamped on `archive()`; consumed by `restore()` to return to the correct prior status. */
  readonly statusBeforeArchive?: ComplianceFrameworkStatus;
  readonly currentVersion: number;
}

/** An immutable snapshot of a {@link ComplianceFramework} at one point in its history. */
export interface ComplianceFrameworkVersion extends TenantAuditableEntity<FrameworkVersionId> {
  readonly frameworkId: ComplianceFrameworkId;
  readonly version: number;
  readonly name: string;
  readonly description?: string;
  readonly requiredControlTypes: readonly ComplianceControlType[];
  readonly status: ComplianceFrameworkStatus;
}
