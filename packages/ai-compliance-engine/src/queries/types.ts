/** @module queries/types */
import type { ComplianceAssessment, ComplianceStatus } from '../assessment/types.js';
import type { ComplianceAudit, ComplianceAuditStatus } from '../audit-engine/types.js';
import type { ComplianceControl, ComplianceControlStatus, ComplianceControlType } from '../control/types.js';
import type { EvidenceRecord } from '../evidence/types.js';
import type { ComplianceFramework, ComplianceFrameworkCode, ComplianceFrameworkStatus } from '../framework/types.js';
import type { Remediation, RemediationStatus } from '../remediation/types.js';
import type { ComplianceReport } from '../report/types.js';
import type { ComplianceFrameworkId, OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';

export interface FindFrameworksQuery extends OrganizationScopedQuery {
  readonly frameworkCode?: ComplianceFrameworkCode;
  readonly status?: ComplianceFrameworkStatus;
}

export interface FindFrameworksResult {
  readonly frameworks: readonly ComplianceFramework[];
  readonly total: number;
}

export interface FindControlsQuery extends OrganizationScopedQuery {
  readonly frameworkId?: ComplianceFrameworkId;
  readonly controlType?: ComplianceControlType;
  readonly status?: ComplianceControlStatus;
}

export interface FindControlsResult {
  readonly controls: readonly ComplianceControl[];
  readonly total: number;
}

export interface FindAssessmentsQuery extends OrganizationScopedQuery {
  readonly frameworkId?: ComplianceFrameworkId;
  readonly status?: ComplianceStatus;
}

export interface FindAssessmentsResult {
  readonly assessments: readonly ComplianceAssessment[];
  readonly total: number;
}

export interface FindEvidenceQuery extends OrganizationScopedQuery {
  readonly controlId?: string;
  readonly frameworkId?: ComplianceFrameworkId;
}

export interface FindEvidenceResult {
  readonly evidence: readonly EvidenceRecord[];
  readonly total: number;
}

export interface FindAuditsQuery extends OrganizationScopedQuery {
  readonly frameworkId?: ComplianceFrameworkId;
  readonly status?: ComplianceAuditStatus;
}

export interface FindAuditsResult {
  readonly audits: readonly ComplianceAudit[];
  readonly total: number;
}

export interface FindReportsQuery extends OrganizationScopedQuery {
  readonly frameworkId?: ComplianceFrameworkId;
}

export interface FindReportsResult {
  readonly reports: readonly ComplianceReport[];
  readonly total: number;
}

export interface FindRemediationsQuery extends OrganizationScopedQuery {
  readonly frameworkId?: ComplianceFrameworkId;
  readonly status?: RemediationStatus;
}

export interface FindRemediationsResult {
  readonly remediations: readonly Remediation[];
  readonly total: number;
}

export interface FindComplianceStatusQuery {
  readonly organizationId: OrganizationId;
  readonly frameworkId?: ComplianceFrameworkId;
}

export interface ComplianceStatusSummary {
  readonly frameworkId: string;
  readonly frameworkCode: ComplianceFrameworkCode;
  readonly status: ComplianceStatus;
  readonly score: number;
  readonly assessedAt?: string;
}

export interface FindComplianceStatusResult {
  readonly statuses: readonly ComplianceStatusSummary[];
}

export interface SearchComplianceQuery extends OrganizationScopedQuery {
  readonly keyword: string;
}

export interface SearchComplianceMatch {
  readonly recordType: 'framework' | 'control' | 'remediation';
  readonly id: string;
  readonly label: string;
  readonly score: number;
}

export interface SearchComplianceResult {
  readonly matches: readonly SearchComplianceMatch[];
  readonly total: number;
}
