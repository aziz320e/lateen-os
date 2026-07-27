import { describe, expect, it } from 'vitest';
import { createGovernanceRuntime } from '../src/runtime.js';
import { createGovernanceEventBus } from '../src/events/governance-event-bus.js';

describe('createGovernanceRuntime', () => {
  it('exposes only services, queries, and the event bus — never repositories', () => {
    const runtime = createGovernanceRuntime();
    expect(Object.keys(runtime).sort()).toEqual(
      [
        'policies',
        'aiGovernance',
        'modelGovernance',
        'agentGovernance',
        'workflowGovernance',
        'approvals',
        'risks',
        'decisions',
        'rules',
        'relationships',
        'queries',
        'events',
      ].sort(),
    );
  });

  it('accepts an injected eventBus and now()', async () => {
    const eventBus = createGovernanceEventBus();
    const fixedNow = '2024-01-01T00:00:00.000Z';
    const runtime = createGovernanceRuntime({ eventBus, now: () => fixedNow });

    expect(runtime.events).toBe(eventBus);
    const policy = await runtime.policies.create('org-1', { name: 'p', policyType: 'security' });
    expect(policy.createdAt).toBe(fixedNow);
  });

  it('is fully usable offline with zero injected collaborators', async () => {
    const runtime = createGovernanceRuntime();
    expect(await runtime.relationships.getBusinessProfileContext('org-1')).toBeNull();
    expect(await runtime.agentGovernance.isAgentRegisteredInRuntime('org-1', 'agent-1')).toBe(false);
    const record = await runtime.workflowGovernance.requestApproval('org-1', { workflowCode: 'wf' });
    await runtime.workflowGovernance.setExecutionPolicy('org-1', record.id, { maxConcurrentInstances: 1 });
    const check = await runtime.workflowGovernance.checkExecutionPolicy('org-1', record.id);
    expect(check.allowed).toBe(true);
    expect(check.reason).toBe('workflow_engine_not_injected');
  });

  it('runtime instances are independent — no shared module-level state', async () => {
    const runtimeA = createGovernanceRuntime();
    const runtimeB = createGovernanceRuntime();
    await runtimeA.policies.create('org-1', { name: 'p', policyType: 'security' });

    const result = await runtimeB.queries.findPolicies({ organizationId: 'org-1' });
    expect(result.total).toBe(0);
  });

  it('approvals compose the same decision data exposed on the runtime', async () => {
    const runtime = createGovernanceRuntime();
    const request = await runtime.approvals.requestApproval('org-1', { category: 'policy_change', subjectId: 'policy-1' });
    await runtime.approvals.approve('org-1', request.id, { reviewerId: 'reviewer-1' });
    const history = await runtime.decisions.findBySubject('org-1', 'policy-1');
    expect(history).toHaveLength(1);
  });

  it('agent governance and workflow governance compose their optionally-injected collaborators', async () => {
    const runtime = createGovernanceRuntime({
      agentRuntimeRegistry: {
        async getRegistry() {
          return { registrations: [{ descriptor: { runtimeAgentId: 'agent-1' }, active: true }] };
        },
      },
      workflowQueries: {
        async findRunningWorkflows() {
          return { instances: [] };
        },
      },
    });

    expect(await runtime.agentGovernance.isAgentRegisteredInRuntime('org-1', 'agent-1')).toBe(true);

    const record = await runtime.workflowGovernance.requestApproval('org-1', { workflowCode: 'wf' });
    await runtime.workflowGovernance.setExecutionPolicy('org-1', record.id, { maxConcurrentInstances: 1 });
    const check = await runtime.workflowGovernance.checkExecutionPolicy('org-1', record.id);
    expect(check.allowed).toBe(true);
    expect(check.reason).toBeUndefined();
  });
});
