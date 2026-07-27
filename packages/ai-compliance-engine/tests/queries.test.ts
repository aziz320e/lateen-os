import { describe, expect, it } from 'vitest';
import { createComplianceRuntime } from '../src/runtime.js';

const ORG = 'org-1';
const ASOF = '2026-06-01T00:00:00.000Z';

async function seed() {
  const runtime = createComplianceRuntime({ now: () => ASOF });

  const frameworkA = await runtime.frameworks.create(ORG, { frameworkCode: 'GDPR', name: 'GDPR', requiredControlTypes: ['technical'] });
  await runtime.frameworks.activate(ORG, frameworkA.id);
  const frameworkB = await runtime.frameworks.create(ORG, { frameworkCode: 'SOC2', name: 'SOC2' });

  const controlA = await runtime.controls.create(ORG, { controlType: 'technical', name: 'Encrypt at rest', frameworkId: frameworkA.id, implementationStatus: 'implemented' });
  await runtime.controls.approve(ORG, controlA.id);
  const controlB = await runtime.controls.create(ORG, { controlType: 'administrative', name: 'Access policy', frameworkId: frameworkB.id });

  await runtime.evidence.collectEvidence(ORG, { controlId: controlA.id, frameworkId: frameworkA.id, source: 'manual' });

  const assessment = await runtime.assessments.runAssessment(ORG, frameworkA.id);

  const audit = await runtime.audits.createAuditPlan(ORG, { title: 'Annual review', frameworkId: frameworkA.id });

  const report = await runtime.reports.generateReport(ORG, frameworkA.id);

  const remediation = await runtime.remediations.createRemediation(ORG, { title: 'Close gap', frameworkId: frameworkA.id });

  return { runtime, frameworkA, frameworkB, controlA, controlB, assessment, audit, report, remediation };
}

describe('createComplianceQueries via createComplianceRuntime', () => {
  it('findFrameworks() filters by frameworkCode', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findFrameworks({ organizationId: ORG, frameworkCode: 'SOC2' });
    expect(result.total).toBe(1);
  });

  it('findFrameworks() filters by status', async () => {
    const { runtime, frameworkA } = await seed();
    const result = await runtime.queries.findFrameworks({ organizationId: ORG, status: 'active' });
    expect(result.frameworks.map((f) => f.id)).toEqual([frameworkA.id]);
  });

  it('findControls() filters by frameworkId', async () => {
    const { runtime, frameworkB, controlB } = await seed();
    const result = await runtime.queries.findControls({ organizationId: ORG, frameworkId: frameworkB.id });
    expect(result.controls.map((c) => c.id)).toEqual([controlB.id]);
  });

  it('findControls() filters by controlType and status', async () => {
    const { runtime, controlA } = await seed();
    const result = await runtime.queries.findControls({ organizationId: ORG, controlType: 'technical', status: 'approved' });
    expect(result.controls.map((c) => c.id)).toEqual([controlA.id]);
  });

  it('findAssessments() filters by frameworkId', async () => {
    // seed() runs one assessment directly, then generateReport() runs a
    // second, fresh one internally — both should be scoped to frameworkA.
    const { runtime, frameworkA, assessment } = await seed();
    const result = await runtime.queries.findAssessments({ organizationId: ORG, frameworkId: frameworkA.id });
    expect(result.total).toBe(2);
    expect(result.assessments.map((a) => a.id)).toContain(assessment.id);
  });

  it('findEvidence() filters by controlId', async () => {
    const { runtime, controlA } = await seed();
    const result = await runtime.queries.findEvidence({ organizationId: ORG, controlId: controlA.id });
    expect(result.total).toBe(1);
  });

  it('findEvidence() filters by frameworkId', async () => {
    const { runtime, frameworkA } = await seed();
    const result = await runtime.queries.findEvidence({ organizationId: ORG, frameworkId: frameworkA.id });
    expect(result.total).toBe(1);
  });

  it('findAudits() filters by frameworkId', async () => {
    const { runtime, frameworkA, audit } = await seed();
    const result = await runtime.queries.findAudits({ organizationId: ORG, frameworkId: frameworkA.id });
    expect(result.audits.map((a) => a.id)).toEqual([audit.id]);
  });

  it('findReports() filters by frameworkId', async () => {
    const { runtime, frameworkA, report } = await seed();
    const result = await runtime.queries.findReports({ organizationId: ORG, frameworkId: frameworkA.id });
    expect(result.reports.map((r) => r.id)).toEqual([report.id]);
  });

  it('findRemediations() filters by frameworkId and status', async () => {
    const { runtime, frameworkA, remediation } = await seed();
    const result = await runtime.queries.findRemediations({ organizationId: ORG, frameworkId: frameworkA.id, status: 'open' });
    expect(result.remediations.map((r) => r.id)).toEqual([remediation.id]);
  });

  it('findComplianceStatus() returns the latest assessment per framework', async () => {
    const { runtime, frameworkA, frameworkB } = await seed();
    const result = await runtime.queries.findComplianceStatus({ organizationId: ORG });
    const statusA = result.statuses.find((s) => s.frameworkId === frameworkA.id);
    const statusB = result.statuses.find((s) => s.frameworkId === frameworkB.id);
    expect(statusA?.status).toBe('compliant');
    expect(statusB?.status).toBe('not_assessed');
  });

  it('findComplianceStatus() filters by frameworkId', async () => {
    const { runtime, frameworkA } = await seed();
    const result = await runtime.queries.findComplianceStatus({ organizationId: ORG, frameworkId: frameworkA.id });
    expect(result.statuses).toHaveLength(1);
  });

  it('searchCompliance() ranks an exact match above a substring match', async () => {
    const { runtime } = await seed();
    await runtime.frameworks.create(ORG, { frameworkCode: 'HIPAA', name: 'GDPR-extended' });
    const result = await runtime.queries.searchCompliance({ organizationId: ORG, keyword: 'GDPR' });
    expect(result.matches[0]?.label).toBe('GDPR');
    expect(result.matches[0]?.score).toBeGreaterThan(result.matches[1]!.score);
  });

  it('searchCompliance() searches across frameworks, controls, and remediations', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.searchCompliance({ organizationId: ORG, keyword: 'Close gap' });
    expect(result.matches.some((m) => m.recordType === 'remediation')).toBe(true);
  });

  it('searchCompliance() returns no matches for an unrelated keyword', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.searchCompliance({ organizationId: ORG, keyword: 'nonexistent-keyword' });
    expect(result.matches).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('paginates via offset/limit while total reflects the full match set', async () => {
    const { runtime } = await seed();
    const all = await runtime.queries.findFrameworks({ organizationId: ORG });
    const page = await runtime.queries.findFrameworks({ organizationId: ORG, offset: 1, limit: 1 });
    expect(page.frameworks).toHaveLength(1);
    expect(page.total).toBe(all.total);
  });

  it('is organization-scoped', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findFrameworks({ organizationId: 'org-2' });
    expect(result.total).toBe(0);
  });
});
