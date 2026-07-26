/**
 * Scenario 2 — a mission whose signals indicate it needs human approval
 * before proceeding, verified two ways against real engine behavior:
 *
 *   - Brain's PlanValidator flags a permission *warning* (not a hard
 *     rejection) when no `actorId` is attached to the session — a real,
 *     already-implemented signal that a human should review before this
 *     plan executes unattended.
 *   - Decision Engine's reasoner deterministically fails to clear a weak
 *     recommendation against high risk, modeling a decision that must be
 *     escalated for approval rather than auto-approved.
 */
import { describe, expect, it } from 'vitest';
import { createLateen } from '@lateen-os/sdk';
import { buildDecision, buildDecisionContext, buildRecommendation } from './fixtures.js';

const ORG = 'org-scenario-2';

describe('Scenario 2: mission requiring approval', () => {
  it('flags a permission warning when no actor is attached, without blocking the plan', async () => {
    const system = createLateen();

    const mission = await system.ceo.submitMission({
      organizationId: ORG,
      title: 'Approve a critical budget reallocation',
      description: 'Move budget between departments for the new market push.',
      priority: 'critical',
    });
    await system.ceo.dispatchMission(ORG, mission.id);

    // No actorId — nobody has been identified as accountable for this session.
    const response = await system.brain.process({
      organizationId: ORG,
      sessionId: 'session-1',
      correlationId: 'corr-1',
      rawInput: 'Approve a critical budget reallocation',
    });

    expect(response.validation.permission.status).toBe('warning');
    expect(response.validation.permission.violations.length).toBeGreaterThan(0);
    // A warning is not a rejection — the plan is still produced and ready.
    expect(response.validation.approved).toBe(true);
    expect(response.executionRequested).toBe(true);
  });

  it("fails Decision Engine's evaluation for a weak recommendation against high risk, modeling an escalation-required decision", async () => {
    const system = createLateen();

    const decision = buildDecision(ORG, { risk: 'high', status: 'pending_approval' });
    const context = buildDecisionContext(ORG, decision.id);
    const weakRecommendation = buildRecommendation(ORG, decision.id, '0.55', '0.60');

    const evaluation = await system.decisionEngine.reasoner.reason({
      decision,
      context,
      recommendations: [weakRecommendation],
    });

    // 0.55 recommendation strength - 0.25 high-risk penalty = 0.30, below the 0.5 pass threshold.
    expect(evaluation.overallScore).toBe('0.30');
    expect(evaluation.passed).toBe(false);
    expect(evaluation.confidence).toBe('0.60');
  });
});
