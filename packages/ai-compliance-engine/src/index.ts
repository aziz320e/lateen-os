/**
 * @lateen-os/ai-compliance-engine — AI Compliance Engine
 *
 * Compliance frameworks, controls, control mapping, evidence,
 * assessments, gap analysis, remediation, audits, retention, and
 * reporting for Lateen OS. Real, deterministic, offline implementation
 * — see `runtime.ts`'s `createComplianceRuntime()` for the composition
 * root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as framework from './framework/index.js';
export * as control from './control/index.js';
export * as controlMapping from './control-mapping/index.js';
export * as evidence from './evidence/index.js';
export * as assessment from './assessment/index.js';
export * as gapAnalysis from './gap-analysis/index.js';
export * as remediation from './remediation/index.js';
export * as auditEngine from './audit-engine/index.js';
export * as retention from './retention/index.js';
export * as report from './report/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createComplianceRuntime,
  type ComplianceRuntime,
  type ComplianceRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type {
  ComplianceFramework,
  ComplianceFrameworkCode,
  ComplianceFrameworkStatus,
  ComplianceFrameworkVersion,
  ComplianceControlType,
  ComplianceFrameworkId,
  FrameworkVersionId,
} from './framework/types.js';
export type { ComplianceControl, ComplianceControlStatus, ControlImplementationStatus, ComplianceControlId } from './control/types.js';
export type { ControlMapping, MappedRecordType, ControlMappingId } from './control-mapping/types.js';
export type { EvidenceRecord, EvidenceAttachment, EvidenceSource, EvidenceRecordId, EvidenceAttachmentId } from './evidence/types.js';
export type { ComplianceAssessment, ComplianceStatus, ControlEvaluationOutcome, ComplianceAssessmentId } from './assessment/types.js';
export type { GapAnalysisResult, RemediationPlanItem, RemediationGapKind, RemediationPriority, GapAnalysisId } from './gap-analysis/types.js';
export type { Remediation, RemediationStatus, RemediationGapType, RemediationId } from './remediation/types.js';
export type { ComplianceAudit, ComplianceAuditStatus, AuditFinding, AuditFindingSeverity, ComplianceAuditId, AuditFindingId } from './audit-engine/types.js';
export type { ComplianceRetentionRule, RetentionDataCategory, ComplianceRetentionRuleId } from './retention/types.js';
export type { ComplianceReport, RemediationProgress, ComplianceReportId } from './report/types.js';

/** Real lifecycle/service ports. */
export {
  type ComplianceFrameworkEngine,
  type CreateFrameworkInput,
  type UpdateFrameworkInput,
  canTransitionFramework,
} from './framework/engine.impl.js';
export {
  type ComplianceControlService,
  type CreateControlInput,
  type UpdateControlInput,
  canTransitionControl,
} from './control/service.impl.js';
export { type ControlMappingService, type MapControlInput } from './control-mapping/service.impl.js';
export { type EvidenceService, type CollectEvidenceInput } from './evidence/service.impl.js';
export {
  type AssessmentEngine,
  type RunAssessmentInput,
  evaluateControlOutcome,
  computeComplianceStatus,
  computeComplianceScore,
} from './assessment/engine.impl.js';
export { type GapAnalysisEngine, type GapAnalysisDeps, type AnalyzeGapsInput } from './gap-analysis/engine.impl.js';
export {
  type RemediationEngine,
  type CreateRemediationInput,
  canTransitionRemediation,
} from './remediation/service.impl.js';
export {
  type AuditEngine,
  type CreateAuditPlanInput,
  type RecordFindingInput,
  canTransitionAudit,
} from './audit-engine/engine.impl.js';
export { type RetentionEngine, type SetRetentionRuleInput, isRetentionExpired } from './retention/engine.impl.js';
export { type ReportEngine, type GenerateReportInput } from './report/engine.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { ComplianceFrameworkRepository, ComplianceFrameworkVersionRepository } from './framework/repository.js';
export type { ComplianceControlRepository } from './control/repository.js';
export type { ControlMappingRepository } from './control-mapping/repository.js';
export type { EvidenceRepository } from './evidence/repository.js';
export type { ComplianceAssessmentRepository } from './assessment/repository.js';
export type { GapAnalysisRepository } from './gap-analysis/repository.js';
export type { RemediationRepository } from './remediation/repository.js';
export type { ComplianceAuditRepository } from './audit-engine/repository.js';
export type { ComplianceRetentionRuleRepository } from './retention/repository.js';
export type { ComplianceReportRepository } from './report/repository.js';

/** Relationship Layer (AI Security Engine / Business DNA / Workflow Engine / Communication Hub integration). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { ComplianceQueries } from './queries/compliance-queries.js';

/** Typed event bus. */
export type { ComplianceDomainEvent } from './events/compliance-events.js';
export { COMPLIANCE_EVENT_NAMES } from './events/compliance-events.js';
