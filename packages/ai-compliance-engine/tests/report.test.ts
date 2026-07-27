import { describe, expect, it } from 'vitest';
import { createComplianceFrameworkRepository } from '../src/framework/repository.impl.js';
import { createComplianceControlRepository } from '../src/control/repository.impl.js';
import { createControlMappingRepository } from '../src/control-mapping/repository.impl.js';
import { createEvidenceRepository } from '../src/evidence/repository.impl.js';
import { createComplianceAssessmentRepository } from '../src/assessment/repository.impl.js';
import { createAssessmentEngine } from '../src/assessment/engine.impl.js';
import { createGapAnalysisRepository } from '../src/gap-analysis/repository.impl.js';
import { createGapAnalysisEngine } from '../src/gap-analysis/engine.impl.js';
import { createRemediationRepository } from '../src/remediation/repository.impl.js';
import { createRemediationEngine } from '../src/remediation/service.impl.js';
import { createComplianceReportRepository } from '../src/report/repository.impl.js';
import { createReportEngine } from '../src/report/engine.impl.js';
import { createComplianceEventBus } from '../src/events/index.js';
import { ComplianceFrameworkNotFoundError } from '../src/shared/errors.js';
import type { ComplianceControl } from '../src/control/types.js';

const ORG = 'org-1';
const ASOF = '2026-06-01T00:00:00.000Z';

function setup(eventBus = createComplianceEventBus()) {
  const frameworkRepository = createComplianceFrameworkRepository();
  const controlRepository = createComplianceControlRepository();
  const controlMappingRepository = createControlMappingRepository();
  const evidenceRepository = createEvidenceRepository();
  const assessmentRepository = createComplianceAssessmentRepository();
  const gapAnalysisRepository = createGapAnalysisRepository();
  const remediationRepository = createRemediationRepository();
  const reportRepository = createComplianceReportRepository();

  const assessmentEngine = createAssessmentEngine(controlRepository, evidenceRepository, assessmentRepository, eventBus);
  const gapAnalysisEngine = createGapAnalysisEngine(frameworkRepository, controlRepository, controlMappingRepository, evidenceRepository, gapAnalysisRepository);
  const remediationEngine = createRemediationEngine(remediationRepository, eventBus);
  const reportEngine = createReportEngine(frameworkRepository, assessmentEngine, gapAnalysisEngine, remediationRepository, reportRepository, eventBus);

  return { frameworkRepository, controlRepository, remediationRepository, remediationEngine, reportEngine, reportRepository };
}

function baseControl(overrides: Partial<ComplianceControl> = {}): ComplianceControl {
  return {
    id: 'control-1',
    organizationId: ORG,
    createdAt: ASOF,
    updatedAt: ASOF,
    frameworkId: 'fw-1',
    controlType: 'technical',
    name: 'c',
    status: 'approved',
    implementationStatus: 'implemented',
    ...overrides,
  };
}

describe('createReportEngine — generateReport', () => {
  it('throws ComplianceFrameworkNotFoundError for an unknown framework', async () => {
    const { reportEngine } = setup();
    await expect(reportEngine.generateReport(ORG, 'missing')).rejects.toBeInstanceOf(ComplianceFrameworkNotFoundError);
  });

  it('generates a report reflecting the real assessment score and status', async () => {
    const { frameworkRepository, controlRepository, reportEngine } = setup();
    await frameworkRepository.save({
      id: 'fw-1',
      organizationId: ORG,
      createdAt: ASOF,
      updatedAt: ASOF,
      frameworkCode: 'SOC2',
      name: 'SOC2',
      requiredControlTypes: ['technical'],
      status: 'active',
      currentVersion: 1,
    });
    await controlRepository.save(baseControl({ implementationStatus: 'not_implemented' }));
    const report = await reportEngine.generateReport(ORG, 'fw-1', { asOf: ASOF });
    expect(report.frameworkCode).toBe('SOC2');
    expect(report.status).toBe('non_compliant');
    expect(report.findings.length).toBeGreaterThan(0);
  });

  it('includes gap analysis findings in the report', async () => {
    const { frameworkRepository, reportEngine } = setup();
    await frameworkRepository.save({
      id: 'fw-1',
      organizationId: ORG,
      createdAt: ASOF,
      updatedAt: ASOF,
      frameworkCode: 'ISO27001',
      name: 'ISO',
      requiredControlTypes: ['administrative'],
      status: 'active',
      currentVersion: 1,
    });
    const report = await reportEngine.generateReport(ORG, 'fw-1', { asOf: ASOF });
    expect(report.gaps.missingControlTypes).toEqual(['administrative']);
    expect(report.findings.some((f) => f.includes('administrative'))).toBe(true);
  });

  it('computes remediation progress from real remediations linked to the framework', async () => {
    const { frameworkRepository, remediationEngine, reportEngine } = setup();
    await frameworkRepository.save({
      id: 'fw-1',
      organizationId: ORG,
      createdAt: ASOF,
      updatedAt: ASOF,
      frameworkCode: 'HIPAA',
      name: 'HIPAA',
      requiredControlTypes: [],
      status: 'active',
      currentVersion: 1,
    });
    const remediation = await remediationEngine.createRemediation(ORG, { title: 'Fix gap', frameworkId: 'fw-1' });
    await remediationEngine.createRemediation(ORG, { title: 'Fix another gap', frameworkId: 'fw-1' });
    await remediationEngine.updateStatus(ORG, remediation.id, 'in_progress');
    await remediationEngine.complete(ORG, remediation.id);

    const report = await reportEngine.generateReport(ORG, 'fw-1', { asOf: ASOF });
    expect(report.remediationProgress).toEqual({ total: 2, completed: 1, percentComplete: 50 });
  });

  it('reports zero remediation progress when no remediations exist', async () => {
    const { frameworkRepository, reportEngine } = setup();
    await frameworkRepository.save({
      id: 'fw-1',
      organizationId: ORG,
      createdAt: ASOF,
      updatedAt: ASOF,
      frameworkCode: 'PCI_DSS',
      name: 'PCI',
      requiredControlTypes: [],
      status: 'active',
      currentVersion: 1,
    });
    const report = await reportEngine.generateReport(ORG, 'fw-1', { asOf: ASOF });
    expect(report.remediationProgress).toEqual({ total: 0, completed: 0, percentComplete: 0 });
  });

  it('publishes compliance.report.generated', async () => {
    const eventBus = createComplianceEventBus();
    const { frameworkRepository, reportEngine } = setup(eventBus);
    await frameworkRepository.save({
      id: 'fw-1',
      organizationId: ORG,
      createdAt: ASOF,
      updatedAt: ASOF,
      frameworkCode: 'EU_AI_ACT',
      name: 'EU AI Act',
      requiredControlTypes: [],
      status: 'active',
      currentVersion: 1,
    });
    let seen: unknown;
    eventBus.subscribe('compliance.report.generated', (payload) => (seen = payload));
    const report = await reportEngine.generateReport(ORG, 'fw-1', { asOf: ASOF });
    expect(seen).toEqual({ organizationId: ORG, reportId: report.id, frameworkId: 'fw-1', score: report.score });
  });
});

describe('createReportEngine — get / findByFrameworkId / org scoping', () => {
  it('get() returns null for an unknown report', async () => {
    const { reportEngine } = setup();
    expect(await reportEngine.get(ORG, 'missing')).toBeNull();
  });

  it('a compliant framework with no gaps produces an empty findings list', async () => {
    const { frameworkRepository, reportEngine } = setup();
    await frameworkRepository.save({
      id: 'fw-1',
      organizationId: ORG,
      createdAt: ASOF,
      updatedAt: ASOF,
      frameworkCode: 'GDPR',
      name: 'GDPR',
      requiredControlTypes: [],
      status: 'active',
      currentVersion: 1,
    });
    const report = await reportEngine.generateReport(ORG, 'fw-1', { asOf: ASOF });
    expect(report.findings).toEqual([]);
    expect(report.status).toBe('not_assessed');
  });

  it('findByFrameworkId() returns every report generated for a framework', async () => {
    const { frameworkRepository, reportEngine } = setup();
    await frameworkRepository.save({
      id: 'fw-1',
      organizationId: ORG,
      createdAt: ASOF,
      updatedAt: ASOF,
      frameworkCode: 'ISO42001',
      name: 'ISO42001',
      requiredControlTypes: [],
      status: 'active',
      currentVersion: 1,
    });
    await reportEngine.generateReport(ORG, 'fw-1', { asOf: ASOF });
    await reportEngine.generateReport(ORG, 'fw-1', { asOf: ASOF });
    const reports = await reportEngine.findByFrameworkId(ORG, 'fw-1');
    expect(reports).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { frameworkRepository, reportEngine, reportRepository } = setup();
    await frameworkRepository.save({
      id: 'fw-1',
      organizationId: ORG,
      createdAt: ASOF,
      updatedAt: ASOF,
      frameworkCode: 'NIST_CSF',
      name: 'NIST',
      requiredControlTypes: [],
      status: 'active',
      currentVersion: 1,
    });
    const report = await reportEngine.generateReport(ORG, 'fw-1', { asOf: ASOF });
    expect(await reportRepository.findById('org-2', report.id)).toBeNull();
  });
});
