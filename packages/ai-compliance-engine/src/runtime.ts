/**
 * Compliance Runtime — the package's composition root. Wires every
 * real in-memory repository and service together: the Compliance
 * Framework Registry, Compliance Controls, Control Mapping, Evidence
 * Management, the Assessment Engine, Gap Analysis (composed with AI
 * Governance Engine), the Remediation Engine, the Audit Engine, the
 * Retention Engine, Compliance Reports (composed internally with
 * Assessment/Gap Analysis/Remediation), the Relationship Layer (AI
 * Security Engine, Business DNA, Workflow Engine, Communication Hub),
 * the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link ComplianceRuntime} surface.
 *
 * @module runtime
 */
import { createAssessmentEngine, createComplianceAssessmentRepository, type AssessmentEngine } from './assessment/index.js';
import { createAuditEngine, createComplianceAuditRepository, type AuditEngine } from './audit-engine/index.js';
import { createComplianceControlRepository, createComplianceControlService, type ComplianceControlService } from './control/index.js';
import { createControlMappingRepository, createControlMappingService, type ControlMappingService } from './control-mapping/index.js';
import { createComplianceEventBus, type ComplianceEventBus } from './events/index.js';
import { createEvidenceRepository, createEvidenceService, type EvidenceService } from './evidence/index.js';
import { createComplianceFrameworkEngine, createComplianceFrameworkRepository, createComplianceFrameworkVersionRepository, type ComplianceFrameworkEngine } from './framework/index.js';
import { createGapAnalysisEngine, createGapAnalysisRepository, type GapAnalysisDeps, type GapAnalysisEngine } from './gap-analysis/index.js';
import { createComplianceQueries, type ComplianceQueries } from './queries/index.js';
import { createRelationshipManagement, type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';
import { createRemediationEngine, createRemediationRepository, type RemediationEngine } from './remediation/index.js';
import { createComplianceReportRepository, createReportEngine, type ReportEngine } from './report/index.js';
import { createComplianceRetentionRuleRepository, createRetentionEngine, type RetentionEngine } from './retention/index.js';
import { nowIso } from './shared/id.js';

export interface ComplianceRuntimeDeps {
  readonly eventBus?: ComplianceEventBus;
  readonly now?: () => string;
  readonly aiSecurity?: RelationshipManagementDeps['aiSecurity'];
  readonly aiGovernance?: GapAnalysisDeps['aiGovernance'];
  readonly businessDna?: RelationshipManagementDeps['businessDna'];
  readonly workflow?: RelationshipManagementDeps['workflow'];
  readonly communicationHub?: RelationshipManagementDeps['communicationHub'];
}

export interface ComplianceRuntime {
  readonly frameworks: ComplianceFrameworkEngine;
  readonly controls: ComplianceControlService;
  readonly controlMappings: ControlMappingService;
  readonly evidence: EvidenceService;
  readonly assessments: AssessmentEngine;
  readonly gapAnalysis: GapAnalysisEngine;
  readonly remediations: RemediationEngine;
  readonly audits: AuditEngine;
  readonly retention: RetentionEngine;
  readonly reports: ReportEngine;
  readonly relationships: RelationshipManagement;
  readonly queries: ComplianceQueries;
  /** Typed event bus — subscribe to framework/assessment/control/evidence/audit/remediation/report events. */
  readonly events: ComplianceEventBus;
}

/** Creates a real, in-memory {@link ComplianceRuntime}. */
export function createComplianceRuntime(deps: ComplianceRuntimeDeps = {}): ComplianceRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createComplianceEventBus();

  const frameworkRepository = createComplianceFrameworkRepository();
  const frameworkVersionRepository = createComplianceFrameworkVersionRepository();
  const controlRepository = createComplianceControlRepository();
  const controlMappingRepository = createControlMappingRepository();
  const evidenceRepository = createEvidenceRepository();
  const assessmentRepository = createComplianceAssessmentRepository();
  const gapAnalysisRepository = createGapAnalysisRepository();
  const remediationRepository = createRemediationRepository();
  const auditRepository = createComplianceAuditRepository();
  const retentionRuleRepository = createComplianceRetentionRuleRepository();
  const reportRepository = createComplianceReportRepository();

  const frameworks = createComplianceFrameworkEngine(frameworkRepository, frameworkVersionRepository, eventBus, now);
  const controls = createComplianceControlService(controlRepository, now);
  const controlMappings = createControlMappingService(controlMappingRepository, now);
  const evidence = createEvidenceService(evidenceRepository, eventBus, now);
  const assessments = createAssessmentEngine(controlRepository, evidenceRepository, assessmentRepository, eventBus, now);
  const gapAnalysis = createGapAnalysisEngine(
    frameworkRepository,
    controlRepository,
    controlMappingRepository,
    evidenceRepository,
    gapAnalysisRepository,
    { aiGovernance: deps.aiGovernance },
    now,
  );
  const remediations = createRemediationEngine(remediationRepository, eventBus, now);
  const audits = createAuditEngine(auditRepository, eventBus, now);
  const retention = createRetentionEngine(retentionRuleRepository, now);
  const reports = createReportEngine(frameworkRepository, assessments, gapAnalysis, remediationRepository, reportRepository, eventBus, now);

  const relationships = createRelationshipManagement({
    aiSecurity: deps.aiSecurity,
    businessDna: deps.businessDna,
    workflow: deps.workflow,
    communicationHub: deps.communicationHub,
  });

  const queries = createComplianceQueries({
    frameworkRepository,
    controlRepository,
    assessmentRepository,
    evidenceRepository,
    auditRepository,
    reportRepository,
    remediationRepository,
  });

  return {
    frameworks,
    controls,
    controlMappings,
    evidence,
    assessments,
    gapAnalysis,
    remediations,
    audits,
    retention,
    reports,
    relationships,
    queries,
    events: eventBus,
  };
}
