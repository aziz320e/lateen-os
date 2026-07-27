import { describe, expect, it } from 'vitest';
import { createGovernanceRuntime } from '../src/runtime.js';

const ORG = 'org-1';

async function seed() {
  const runtime = createGovernanceRuntime();

  const policyA = await runtime.policies.create(ORG, { name: 'security-baseline', policyType: 'security' });
  await runtime.policies.activate(ORG, policyA.id);
  await runtime.policies.update(ORG, policyA.id, { description: 'updated' });
  const policyB = await runtime.policies.create(ORG, { name: 'workflow-policy', policyType: 'workflow' });

  const approvalA = await runtime.approvals.requestApproval(ORG, { category: 'policy_change', subjectId: policyA.id });
  await runtime.approvals.approve(ORG, approvalA.id, { reviewerId: 'reviewer-1' });
  const approvalB = await runtime.approvals.requestApproval(ORG, { category: 'security_exception', subjectId: 'exception-subject' });
  await runtime.approvals.approve(ORG, approvalB.id, { reviewerId: 'reviewer-2', rationale: 'temporary' });

  const riskA = await runtime.risks.createRisk(ORG, { title: 'high-risk', category: 'ai', riskLevel: 'high' });
  const riskB = await runtime.risks.createRisk(ORG, { title: 'low-risk', category: 'ai', riskLevel: 'low' });
  void riskB;

  return { runtime, policyA, policyB, approvalA, approvalB, riskA };
}

describe('createGovernanceQueries via createGovernanceRuntime', () => {
  it('findPolicies() filters by policyType', async () => {
    const { runtime, policyB } = await seed();
    const result = await runtime.queries.findPolicies({ organizationId: ORG, policyType: 'workflow' });
    expect(result.policies.map((p) => p.id)).toEqual([policyB.id]);
  });

  it('findPolicies() filters by status', async () => {
    const { runtime, policyA } = await seed();
    const result = await runtime.queries.findPolicies({ organizationId: ORG, status: 'active' });
    expect(result.policies.map((p) => p.id)).toEqual([policyA.id]);
  });

  it('findPolicyVersions() returns full version history', async () => {
    const { runtime, policyA } = await seed();
    const result = await runtime.queries.findPolicyVersions({ organizationId: ORG, policyId: policyA.id });
    expect(result.versions.length).toBeGreaterThanOrEqual(3);
  });

  it('findApprovals() filters by category', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findApprovals({ organizationId: ORG, category: 'security_exception' });
    expect(result.total).toBe(1);
  });

  it('findApprovals() filters by status', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findApprovals({ organizationId: ORG, status: 'approved' });
    expect(result.total).toBe(2);
  });

  it('findRisks() filters by riskLevel', async () => {
    const { runtime, riskA } = await seed();
    const result = await runtime.queries.findRisks({ organizationId: ORG, riskLevel: 'high' });
    expect(result.risks.map((r) => r.id)).toEqual([riskA.id]);
  });

  it('findPolicyVersions() returns an empty list for an unknown policy', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findPolicyVersions({ organizationId: ORG, policyId: 'missing' });
    expect(result.versions).toEqual([]);
  });

  it('searchGovernance() respects the limit', async () => {
    const { runtime } = await seed();
    await runtime.policies.create(ORG, { name: 'security-baseline-two', policyType: 'security' });
    const result = await runtime.queries.searchGovernance({ organizationId: ORG, keyword: 'security', limit: 1 });
    expect(result.matches).toHaveLength(1);
  });

  it('findExceptions() returns the granted security exception', async () => {
    const { runtime, approvalB } = await seed();
    const result = await runtime.queries.findExceptions({ organizationId: ORG });
    expect(result.total).toBe(1);
    expect(result.exceptions[0]?.approvalRequestId).toBe(approvalB.id);
  });

  it('findGovernanceEvents() returns the recorded decisions', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findGovernanceEvents({ organizationId: ORG, outcome: 'approved' });
    expect(result.total).toBe(2);
  });

  it('findGovernanceEvents() filters by decisionType', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findGovernanceEvents({ organizationId: ORG, decisionType: 'security_exception' });
    expect(result.total).toBe(1);
  });

  it('findAuditEvents-equivalent pagination: findPolicies() paginates via offset/limit while total reflects the full match set', async () => {
    const { runtime } = await seed();
    const all = await runtime.queries.findPolicies({ organizationId: ORG });
    const page = await runtime.queries.findPolicies({ organizationId: ORG, offset: 1, limit: 1 });
    expect(page.policies).toHaveLength(1);
    expect(page.total).toBe(all.total);
  });

  it('searchGovernance() ranks an exact match above a substring match', async () => {
    const { runtime } = await seed();
    await runtime.policies.create(ORG, { name: 'security-baseline-extended', policyType: 'security' });
    const result = await runtime.queries.searchGovernance({ organizationId: ORG, keyword: 'security-baseline' });
    expect(result.matches[0]?.label).toBe('security-baseline');
    expect(result.matches[0]?.score).toBeGreaterThan(result.matches[1]!.score);
  });

  it('searchGovernance() searches across policies, risks, and rules', async () => {
    const { runtime } = await seed();
    await runtime.rules.createRule(ORG, { name: 'high-risk-rule', appliesTo: 'runtime_action', conditions: [], effect: 'deny' });
    const result = await runtime.queries.searchGovernance({ organizationId: ORG, keyword: 'high-risk' });
    const recordTypes = new Set(result.matches.map((m) => m.recordType));
    expect(recordTypes.has('risk')).toBe(true);
    expect(recordTypes.has('rule')).toBe(true);
  });

  it('searchGovernance() returns no matches for an unrelated keyword', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.searchGovernance({ organizationId: ORG, keyword: 'nonexistent-keyword' });
    expect(result.matches).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('is organization-scoped', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findPolicies({ organizationId: 'org-2' });
    expect(result.total).toBe(0);
  });
});
