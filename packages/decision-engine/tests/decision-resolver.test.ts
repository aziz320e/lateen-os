import { describe, expect, it } from 'vitest';
import { createDecisionResolver } from '../src/reasoning/decision-resolver.impl.js';
import type { Decision } from '../src/decision/types.js';
import type { EvaluationResult } from '../src/evaluation/types.js';
import type { ApprovalFlow } from '../src/approval/types.js';

const now = new Date().toISOString();

const decision: Decision = {
  id: 'd1',
  organizationId: 'org-1',
  createdAt: now,
  updatedAt: now,
  title: 'Test',
  description: 'desc',
  category: 'approval',
  status: 'evaluating',
  requestedBy: { type: 'agent' },
  requestedAt: now,
  confidence: '0.8',
  risk: 'low',
  priority: 'normal',
};

function makeEvaluation(passed: boolean): EvaluationResult {
  return {
    id: 'e1',
    organizationId: 'org-1',
    createdAt: now,
    updatedAt: now,
    decisionId: 'd1',
    criteria: [],
    scores: [],
    overallScore: passed ? '0.8' : '0.2',
    confidence: '0.8',
    passed,
  };
}

function makeApproval(status: ApprovalFlow['status']): ApprovalFlow {
  return {
    id: 'af1',
    organizationId: 'org-1',
    createdAt: now,
    updatedAt: now,
    decisionId: 'd1',
    steps: [],
    status,
  };
}

describe('createDecisionResolver', () => {
  it('resolves to approved when the evaluation passes and there is no approval flow', async () => {
    const resolver = createDecisionResolver();
    const resolution = await resolver.resolve(decision, makeEvaluation(true));
    expect(resolution.decision.status).toBe('approved');
    expect(resolution.decision.decidedAt).toBeTruthy();
  });

  it('resolves to rejected when the evaluation fails and there is no approval flow', async () => {
    const resolver = createDecisionResolver();
    const resolution = await resolver.resolve(decision, makeEvaluation(false));
    expect(resolution.decision.status).toBe('rejected');
  });

  it('defers to the approval flow status when one is present, even if evaluation passed', async () => {
    const resolver = createDecisionResolver();
    const resolution = await resolver.resolve(decision, makeEvaluation(true), makeApproval('rejected'));
    expect(resolution.decision.status).toBe('rejected');
  });

  it('resolves to pending_approval for an in-progress approval flow', async () => {
    const resolver = createDecisionResolver();
    const resolution = await resolver.resolve(decision, makeEvaluation(true), makeApproval('in_progress'));
    expect(resolution.decision.status).toBe('pending_approval');
  });

  it('preserves the original decision fields other than status/decidedAt', async () => {
    const resolver = createDecisionResolver();
    const resolution = await resolver.resolve(decision, makeEvaluation(true));
    expect(resolution.decision.title).toBe(decision.title);
    expect(resolution.decision.id).toBe(decision.id);
  });
});
