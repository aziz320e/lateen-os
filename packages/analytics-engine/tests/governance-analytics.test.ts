import { describe, expect, it } from 'vitest';
import { createGovernanceRuntime } from '@lateen-os/ai-governance-engine';
import { createGovernanceAnalyticsRepository } from '../src/governance-analytics/repository.impl.js';
import { createGovernanceAnalyticsEngine } from '../src/governance-analytics/engine.impl.js';

const ORG = 'org-1';

function setup() {
  const repository = createGovernanceAnalyticsRepository();
  return { repository };
}

describe('createGovernanceAnalyticsEngine — fully offline (no AI Governance Engine injected)', () => {
  it('returns a zeroed snapshot', async () => {
    const { repository } = setup();
    const engine = createGovernanceAnalyticsEngine(repository, {});
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.activePolicies).toBe(0);
    expect(snapshot.riskDistribution).toEqual({});
  });
});

describe('createGovernanceAnalyticsEngine — with a real AI Governance Engine', () => {
  it('counts real active policies', async () => {
    const aiGovernance = createGovernanceRuntime();
    const policy = await aiGovernance.policies.create(ORG, { name: 'Data Policy', policyType: 'business' });
    await aiGovernance.policies.activate(ORG, policy.id);

    const { repository } = setup();
    const engine = createGovernanceAnalyticsEngine(repository, { aiGovernance });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.activePolicies).toBe(1);
  });

  it('counts real pending approvals', async () => {
    const aiGovernance = createGovernanceRuntime();
    await aiGovernance.approvals.requestApproval(ORG, { category: 'policy_change', subjectId: 'policy-1' });

    const { repository } = setup();
    const engine = createGovernanceAnalyticsEngine(repository, { aiGovernance });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.pendingApprovals).toBe(1);
  });

  it('counts real rejected governance decisions as violations', async () => {
    const aiGovernance = createGovernanceRuntime();
    const request = await aiGovernance.approvals.requestApproval(ORG, { category: 'model_approval', subjectId: 'gpt-4' });
    await aiGovernance.approvals.reject(ORG, request.id, { reviewerId: 'reviewer-1' });

    const { repository } = setup();
    const engine = createGovernanceAnalyticsEngine(repository, { aiGovernance });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.governanceViolations).toBe(1);
  });

  it('computes real risk distribution by level', async () => {
    const aiGovernance = createGovernanceRuntime();
    await aiGovernance.risks.createRisk(ORG, { title: 'r1', category: 'ai', riskLevel: 'high' });
    await aiGovernance.risks.createRisk(ORG, { title: 'r2', category: 'ai', riskLevel: 'high' });
    await aiGovernance.risks.createRisk(ORG, { title: 'r3', category: 'ai', riskLevel: 'low' });

    const { repository } = setup();
    const engine = createGovernanceAnalyticsEngine(repository, { aiGovernance });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.riskDistribution).toEqual({ high: 2, low: 1 });
  });
});

describe('createGovernanceAnalyticsEngine — get / list / org scoping', () => {
  it('get() returns null for an unknown snapshot', async () => {
    const { repository } = setup();
    const engine = createGovernanceAnalyticsEngine(repository, {});
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every computed snapshot', async () => {
    const { repository } = setup();
    const engine = createGovernanceAnalyticsEngine(repository, {});
    await engine.computeSnapshot(ORG);
    await engine.computeSnapshot(ORG);
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { repository } = setup();
    const engine = createGovernanceAnalyticsEngine(repository, {});
    const snapshot = await engine.computeSnapshot(ORG);
    expect(await repository.findById('org-2', snapshot.id)).toBeNull();
  });
});
