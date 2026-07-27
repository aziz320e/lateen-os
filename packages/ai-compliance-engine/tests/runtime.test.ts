import { describe, expect, it } from 'vitest';
import { createComplianceRuntime } from '../src/runtime.js';
import { createComplianceEventBus } from '../src/events/compliance-event-bus.js';

describe('createComplianceRuntime', () => {
  it('exposes only services, queries, and the event bus — never repositories', () => {
    const runtime = createComplianceRuntime();
    expect(Object.keys(runtime).sort()).toEqual(
      [
        'frameworks',
        'controls',
        'controlMappings',
        'evidence',
        'assessments',
        'gapAnalysis',
        'remediations',
        'audits',
        'retention',
        'reports',
        'relationships',
        'queries',
        'events',
      ].sort(),
    );
  });

  it('accepts an injected eventBus and now()', async () => {
    const eventBus = createComplianceEventBus();
    const fixedNow = '2024-01-01T00:00:00.000Z';
    const runtime = createComplianceRuntime({ eventBus, now: () => fixedNow });

    expect(runtime.events).toBe(eventBus);
    const framework = await runtime.frameworks.create('org-1', { frameworkCode: 'GDPR', name: 'g' });
    expect(framework.createdAt).toBe(fixedNow);
  });

  it('is fully usable offline with zero injected collaborators', async () => {
    const runtime = createComplianceRuntime();
    expect(await runtime.relationships.getBusinessProfileContext('org-1')).toBeNull();
    const framework = await runtime.frameworks.create('org-1', { frameworkCode: 'GDPR', name: 'g' });
    const gaps = await runtime.gapAnalysis.analyze('org-1', framework.id);
    expect(gaps.orphanedPolicyIds).toEqual([]);
  });

  it('runtime instances are independent — no shared module-level state', async () => {
    const runtimeA = createComplianceRuntime();
    const runtimeB = createComplianceRuntime();
    await runtimeA.frameworks.create('org-1', { frameworkCode: 'GDPR', name: 'g' });

    const result = await runtimeB.queries.findFrameworks({ organizationId: 'org-1' });
    expect(result.total).toBe(0);
  });

  it('reports compose the same assessment/gap-analysis/remediation data exposed on the runtime', async () => {
    const runtime = createComplianceRuntime();
    const framework = await runtime.frameworks.create('org-1', { frameworkCode: 'SOC2', name: 's', requiredControlTypes: [] });
    const report = await runtime.reports.generateReport('org-1', framework.id);
    const assessments = await runtime.assessments.findByFrameworkId('org-1', framework.id);
    expect(assessments.map((a) => a.score)).toContain(report.score);
  });

  it('gap analysis composes the real, injected AI Governance Engine queries when provided', async () => {
    const runtime = createComplianceRuntime({
      aiGovernance: {
        findPolicies: async () => ({ policies: [{ id: 'policy-1' }] as never, total: 1 }),
      },
    });
    const framework = await runtime.frameworks.create('org-1', { frameworkCode: 'GDPR', name: 'g', requiredControlTypes: [] });
    const gaps = await runtime.gapAnalysis.analyze('org-1', framework.id);
    expect(gaps.orphanedPolicyIds).toEqual(['policy-1']);
  });
});
