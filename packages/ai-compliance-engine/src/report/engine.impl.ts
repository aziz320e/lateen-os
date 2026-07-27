/**
 * Real Compliance Reports engine — generates a deterministic report for
 * any supported framework by composing this package's own Assessment
 * Engine, Gap Analysis engine, and Remediation Engine (intra-package
 * composition, wired together at `runtime.ts`).
 *
 * @module report/engine.impl
 */
import type { AssessmentEngine } from '../assessment/engine.impl.js';
import type { ComplianceEventBus } from '../events/compliance-event-bus.js';
import type { GapAnalysisEngine } from '../gap-analysis/engine.impl.js';
import type { RemediationRepository } from '../remediation/repository.js';
import type { ComplianceFrameworkRepository } from '../framework/repository.js';
import { ComplianceFrameworkNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ComplianceFrameworkId, OrganizationId } from '../shared/identifiers.js';
import type { ComplianceReportRepository } from './repository.js';
import type { ComplianceReport, RemediationProgress } from './types.js';

export interface GenerateReportInput {
  readonly asOf?: string;
}

export interface ReportEngine {
  generateReport(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId, input?: GenerateReportInput): Promise<ComplianceReport>;
  get(organizationId: OrganizationId, reportId: string): Promise<ComplianceReport | null>;
  findByFrameworkId(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<readonly ComplianceReport[]>;
}

/** Creates a real {@link ReportEngine} composing the framework, assessment, gap-analysis, remediation, and report repositories/engines. */
export function createReportEngine(
  frameworkRepository: ComplianceFrameworkRepository,
  assessmentEngine: AssessmentEngine,
  gapAnalysisEngine: GapAnalysisEngine,
  remediationRepository: RemediationRepository,
  repository: ComplianceReportRepository,
  eventBus?: ComplianceEventBus,
  now: () => string = nowIso,
): ReportEngine {
  return {
    async generateReport(organizationId, frameworkId, input) {
      const asOf = input?.asOf ?? now();
      const framework = await frameworkRepository.findById(organizationId, frameworkId);
      if (!framework) throw new ComplianceFrameworkNotFoundError(frameworkId);

      const assessment = await assessmentEngine.runAssessment(organizationId, frameworkId, { asOf });
      const gaps = await gapAnalysisEngine.analyze(organizationId, frameworkId, { asOf });

      const findings: string[] = [
        ...assessment.failedControlIds.map((controlId) => `Control "${controlId}" failed compliance assessment.`),
        ...gaps.missingControlTypes.map((type) => `Missing a required, approved, implemented "${type}" control.`),
        ...gaps.expiredControlIds.map((controlId) => `Control "${controlId}" has expired.`),
        ...gaps.controlsMissingEvidenceIds.map((controlId) => `Control "${controlId}" is missing evidence.`),
        ...gaps.orphanedPolicyIds.map((policyId) => `Policy "${policyId}" is not mapped to any compliance control.`),
      ];

      const frameworkRemediations = await remediationRepository.findByFrameworkId(organizationId, frameworkId);
      const completedCount = frameworkRemediations.filter((remediation) => remediation.status === 'completed').length;
      const remediationProgress: RemediationProgress = {
        total: frameworkRemediations.length,
        completed: completedCount,
        percentComplete: frameworkRemediations.length === 0 ? 0 : Math.round((completedCount / frameworkRemediations.length) * 10000) / 100,
      };

      const timestamp = now();
      const report: ComplianceReport = {
        id: generateId('compliance-report'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        frameworkId,
        frameworkCode: framework.frameworkCode,
        status: assessment.status,
        score: assessment.score,
        findings,
        gaps,
        remediationProgress,
        generatedAt: timestamp,
      };
      await repository.save(report);
      eventBus?.publish('compliance.report.generated', { organizationId, reportId: report.id, frameworkId, score: report.score });
      return report;
    },

    async get(organizationId, reportId) {
      return repository.findById(organizationId, reportId);
    },

    async findByFrameworkId(organizationId, frameworkId) {
      return repository.findByFrameworkId(organizationId, frameworkId);
    },
  };
}
