import { describe, expect, it } from 'vitest';
import { createComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import { createComplianceAnalyticsRepository } from '../src/compliance-analytics/repository.impl.js';
import { createComplianceAnalyticsEngine } from '../src/compliance-analytics/engine.impl.js';

const ORG = 'org-1';

function setup() {
  const repository = createComplianceAnalyticsRepository();
  return { repository };
}

describe('createComplianceAnalyticsEngine — fully offline (no AI Compliance Engine injected)', () => {
  it('returns a zeroed snapshot', async () => {
    const { repository } = setup();
    const engine = createComplianceAnalyticsEngine(repository, {});
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.complianceScore).toBe(0);
    expect(snapshot.frameworkCoverage).toBe(0);
  });
});

describe('createComplianceAnalyticsEngine — with a real AI Compliance Engine', () => {
  async function seedFramework() {
    const aiCompliance = createComplianceRuntime();
    const framework = await aiCompliance.frameworks.create(ORG, { frameworkCode: 'SOC2', name: 'SOC2', requiredControlTypes: ['technical'] });
    await aiCompliance.frameworks.activate(ORG, framework.id);

    const control = await aiCompliance.controls.create(ORG, {
      controlType: 'technical',
      name: 'Encrypt at rest',
      frameworkId: framework.id,
      implementationStatus: 'implemented',
    });
    await aiCompliance.controls.approve(ORG, control.id);
    await aiCompliance.evidence.collectEvidence(ORG, { controlId: control.id, source: 'manual' });

    await aiCompliance.assessments.runAssessment(ORG, framework.id);

    return { aiCompliance, framework };
  }

  it('computes a real, aggregate compliance score', async () => {
    const { aiCompliance } = await seedFramework();
    const { repository } = setup();
    const engine = createComplianceAnalyticsEngine(repository, { aiCompliance });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.complianceScore).toBe(100);
  });

  it('sums real passed controls across assessments', async () => {
    const { aiCompliance } = await seedFramework();
    const { repository } = setup();
    const engine = createComplianceAnalyticsEngine(repository, { aiCompliance });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.passedControls).toBe(1);
    expect(snapshot.failedControls).toBe(0);
  });

  it('computes real remediation progress', async () => {
    const { aiCompliance, framework } = await seedFramework();
    const remediation = await aiCompliance.remediations.createRemediation(ORG, { title: 'Fix gap', frameworkId: framework.id });
    await aiCompliance.remediations.updateStatus(ORG, remediation.id, 'in_progress');
    await aiCompliance.remediations.complete(ORG, remediation.id);

    const { repository } = setup();
    const engine = createComplianceAnalyticsEngine(repository, { aiCompliance });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.remediationProgress).toEqual({ total: 1, completed: 1, percentComplete: 100 });
  });

  it('computes real framework coverage', async () => {
    const { aiCompliance } = await seedFramework();
    await aiCompliance.frameworks.create(ORG, { frameworkCode: 'HIPAA', name: 'HIPAA' });

    const { repository } = setup();
    const engine = createComplianceAnalyticsEngine(repository, { aiCompliance });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.frameworkCoverage).toBe(50);
  });
});

describe('createComplianceAnalyticsEngine — get / list / org scoping', () => {
  it('get() returns null for an unknown snapshot', async () => {
    const { repository } = setup();
    const engine = createComplianceAnalyticsEngine(repository, {});
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every computed snapshot', async () => {
    const { repository } = setup();
    const engine = createComplianceAnalyticsEngine(repository, {});
    await engine.computeSnapshot(ORG);
    await engine.computeSnapshot(ORG);
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { repository } = setup();
    const engine = createComplianceAnalyticsEngine(repository, {});
    const snapshot = await engine.computeSnapshot(ORG);
    expect(await repository.findById('org-2', snapshot.id)).toBeNull();
  });
});
