/**
 * Real {@link ComplianceQueries} implementation — a CQRS read layer
 * composed over the AI Compliance Engine repositories. Repositories are
 * taken as constructor dependencies but never returned to callers.
 *
 * @module queries/compliance-queries.impl
 */
import type { ComplianceAssessmentRepository } from '../assessment/repository.js';
import type { ComplianceAuditRepository } from '../audit-engine/repository.js';
import type { ComplianceControlRepository } from '../control/repository.js';
import type { EvidenceRepository } from '../evidence/repository.js';
import type { ComplianceFrameworkRepository } from '../framework/repository.js';
import type { RemediationRepository } from '../remediation/repository.js';
import type { ComplianceReportRepository } from '../report/repository.js';
import type { ComplianceQueries } from './compliance-queries.js';
import type {
  FindAssessmentsQuery,
  FindAssessmentsResult,
  FindAuditsQuery,
  FindAuditsResult,
  FindComplianceStatusQuery,
  FindComplianceStatusResult,
  FindControlsQuery,
  FindControlsResult,
  FindEvidenceQuery,
  FindEvidenceResult,
  FindFrameworksQuery,
  FindFrameworksResult,
  FindRemediationsQuery,
  FindRemediationsResult,
  FindReportsQuery,
  FindReportsResult,
  SearchComplianceMatch,
  SearchComplianceQuery,
  SearchComplianceResult,
} from './types.js';

export interface ComplianceQueriesDeps {
  readonly frameworkRepository: ComplianceFrameworkRepository;
  readonly controlRepository: ComplianceControlRepository;
  readonly assessmentRepository: ComplianceAssessmentRepository;
  readonly evidenceRepository: EvidenceRepository;
  readonly auditRepository: ComplianceAuditRepository;
  readonly reportRepository: ComplianceReportRepository;
  readonly remediationRepository: RemediationRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}

/** Creates a real {@link ComplianceQueries} read port over the given repositories. */
export function createComplianceQueries(deps: ComplianceQueriesDeps): ComplianceQueries {
  return {
    async findFrameworks(query: FindFrameworksQuery): Promise<FindFrameworksResult> {
      let frameworks = query.frameworkCode
        ? await deps.frameworkRepository.findByCode(query.organizationId, query.frameworkCode)
        : await deps.frameworkRepository.findAll(query.organizationId);
      if (query.status) frameworks = frameworks.filter((framework) => framework.status === query.status);
      return { frameworks: paginate(frameworks, query.offset, query.limit), total: frameworks.length };
    },

    async findControls(query: FindControlsQuery): Promise<FindControlsResult> {
      let controls = query.frameworkId
        ? await deps.controlRepository.findByFrameworkId(query.organizationId, query.frameworkId)
        : await deps.controlRepository.findAll(query.organizationId);
      if (query.controlType) controls = controls.filter((control) => control.controlType === query.controlType);
      if (query.status) controls = controls.filter((control) => control.status === query.status);
      return { controls: paginate(controls, query.offset, query.limit), total: controls.length };
    },

    async findAssessments(query: FindAssessmentsQuery): Promise<FindAssessmentsResult> {
      let assessments = query.frameworkId
        ? await deps.assessmentRepository.findByFrameworkId(query.organizationId, query.frameworkId)
        : await deps.assessmentRepository.findAll(query.organizationId);
      if (query.status) assessments = assessments.filter((assessment) => assessment.status === query.status);
      return { assessments: paginate(assessments, query.offset, query.limit), total: assessments.length };
    },

    async findEvidence(query: FindEvidenceQuery): Promise<FindEvidenceResult> {
      let evidence = query.frameworkId
        ? await deps.evidenceRepository.findByFrameworkId(query.organizationId, query.frameworkId)
        : await deps.evidenceRepository.findAll(query.organizationId);
      if (query.controlId) evidence = evidence.filter((record) => record.controlId === query.controlId);
      return { evidence: paginate(evidence, query.offset, query.limit), total: evidence.length };
    },

    async findAudits(query: FindAuditsQuery): Promise<FindAuditsResult> {
      let audits = query.frameworkId
        ? await deps.auditRepository.findByFrameworkId(query.organizationId, query.frameworkId)
        : await deps.auditRepository.findAll(query.organizationId);
      if (query.status) audits = audits.filter((audit) => audit.status === query.status);
      return { audits: paginate(audits, query.offset, query.limit), total: audits.length };
    },

    async findReports(query: FindReportsQuery): Promise<FindReportsResult> {
      const reports = query.frameworkId
        ? await deps.reportRepository.findByFrameworkId(query.organizationId, query.frameworkId)
        : await deps.reportRepository.findAll(query.organizationId);
      return { reports: paginate(reports, query.offset, query.limit), total: reports.length };
    },

    async findRemediations(query: FindRemediationsQuery): Promise<FindRemediationsResult> {
      let remediations = query.frameworkId
        ? await deps.remediationRepository.findByFrameworkId(query.organizationId, query.frameworkId)
        : await deps.remediationRepository.findAll(query.organizationId);
      if (query.status) remediations = remediations.filter((remediation) => remediation.status === query.status);
      return { remediations: paginate(remediations, query.offset, query.limit), total: remediations.length };
    },

    async findComplianceStatus(query: FindComplianceStatusQuery): Promise<FindComplianceStatusResult> {
      const frameworks = query.frameworkId
        ? [await deps.frameworkRepository.findById(query.organizationId, query.frameworkId)].filter((f): f is NonNullable<typeof f> => f !== null)
        : await deps.frameworkRepository.findAll(query.organizationId);

      const statuses = await Promise.all(
        frameworks.map(async (framework) => {
          const assessments = await deps.assessmentRepository.findByFrameworkId(query.organizationId, framework.id);
          // Reverse before a stable sort so a tie on `assessedAt` (millisecond
          // clock resolution) resolves to the most recently inserted assessment.
          const latest = [...assessments].reverse().sort((a, b) => (a.assessedAt < b.assessedAt ? 1 : a.assessedAt > b.assessedAt ? -1 : 0))[0];
          return {
            frameworkId: framework.id,
            frameworkCode: framework.frameworkCode,
            status: latest?.status ?? 'not_assessed',
            score: latest?.score ?? 0,
            assessedAt: latest?.assessedAt,
          };
        }),
      );

      return { statuses };
    },

    async searchCompliance(query: SearchComplianceQuery): Promise<SearchComplianceResult> {
      const [frameworks, controls, remediations] = await Promise.all([
        deps.frameworkRepository.findAll(query.organizationId),
        deps.controlRepository.findAll(query.organizationId),
        deps.remediationRepository.findAll(query.organizationId),
      ]);

      const matches: SearchComplianceMatch[] = [];
      for (const framework of frameworks) {
        const score = scoreLabel(framework.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'framework', id: framework.id, label: framework.name, score });
      }
      for (const control of controls) {
        const score = scoreLabel(control.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'control', id: control.id, label: control.name, score });
      }
      for (const remediation of remediations) {
        const score = scoreLabel(remediation.title, query.keyword);
        if (score > 0) matches.push({ recordType: 'remediation', id: remediation.id, label: remediation.title, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      const limited = query.limit === undefined ? matches : matches.slice(0, query.limit);
      return { matches: limited, total: matches.length };
    },
  };
}
