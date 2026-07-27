import { describe, expect, it, vi } from 'vitest';
import { createGovernanceEventBus } from '../src/events/governance-event-bus.js';
import { GOVERNANCE_EVENT_NAMES } from '../src/events/governance-events.js';
import { createGovernanceRuntime } from '../src/runtime.js';

describe('GOVERNANCE_EVENT_NAMES', () => {
  it('declares exactly the 10 required event names', () => {
    expect(Object.values(GOVERNANCE_EVENT_NAMES).sort()).toEqual(
      [
        'policy.created',
        'policy.updated',
        'policy.activated',
        'policy.deactivated',
        'approval.requested',
        'approval.completed',
        'risk.created',
        'risk.escalated',
        'governance.violation.detected',
        'governance.audit.created',
      ].sort(),
    );
  });
});

describe('createGovernanceEventBus', () => {
  it('dispatches to subscribers of the exact event name only', () => {
    const eventBus = createGovernanceEventBus();
    const policyCreated = vi.fn();
    const riskCreated = vi.fn();
    eventBus.subscribe('policy.created', policyCreated);
    eventBus.subscribe('risk.created', riskCreated);

    eventBus.publish('policy.created', { organizationId: 'org-1', policyId: 'p1', policyType: 'security' });

    expect(policyCreated).toHaveBeenCalledTimes(1);
    expect(riskCreated).not.toHaveBeenCalled();
  });
});

describe('end-to-end event flow through createGovernanceRuntime()', () => {
  it('every declared event is genuinely published by the real service that causes it', async () => {
    const runtime = createGovernanceRuntime();
    const seen: string[] = [];
    for (const eventName of Object.values(GOVERNANCE_EVENT_NAMES)) {
      runtime.events.subscribe(eventName, () => seen.push(eventName));
    }

    const ORG = 'org-1';

    const policy = await runtime.policies.create(ORG, { name: 'p', policyType: 'security' });
    await runtime.policies.update(ORG, policy.id, { name: 'p2' });
    await runtime.policies.activate(ORG, policy.id);
    await runtime.policies.deactivate(ORG, policy.id);

    const approvalRequest = await runtime.approvals.requestApproval(ORG, { category: 'policy_change', subjectId: policy.id });
    await runtime.approvals.approve(ORG, approvalRequest.id, { reviewerId: 'reviewer-1' });

    const risk = await runtime.risks.createRisk(ORG, { title: 'r', category: 'ai', riskLevel: 'high' });
    await runtime.risks.escalate(ORG, risk.id);

    const rule = await runtime.rules.createRule(ORG, {
      name: 'deny-all',
      appliesTo: 'runtime_action',
      conditions: [],
      effect: 'deny',
    });
    await runtime.rules.evaluate(ORG, { appliesTo: 'runtime_action', attributes: {} });
    void rule;

    await Promise.resolve();

    expect(new Set(seen)).toEqual(new Set(Object.values(GOVERNANCE_EVENT_NAMES)));
  });
});
