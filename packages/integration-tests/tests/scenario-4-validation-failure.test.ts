/**
 * Scenario 4 — validation failure. Decision Engine's reasoner
 * deterministically rejects a weak proposal against critical risk, and a
 * CEO mission that consequently fails cannot be silently resurrected —
 * its state machine rejects any further transition once terminal.
 */
import { describe, expect, it } from 'vitest';
import { createLateen } from '@lateen-os/sdk';
import { buildDecision, buildDecisionContext, buildRecommendation } from './fixtures.js';

const ORG = 'org-scenario-4';

describe('Scenario 4: validation failure', () => {
  it('Decision Engine rejects a weak recommendation against critical risk', async () => {
    const system = createLateen();

    const decision = buildDecision(ORG, { risk: 'critical' });
    const context = buildDecisionContext(ORG, decision.id);
    const weakRecommendation = buildRecommendation(ORG, decision.id, '0.30', '0.40');

    const evaluation = await system.decisionEngine.reasoner.reason({
      decision,
      context,
      recommendations: [weakRecommendation],
    });

    // 0.30 recommendation strength - 0.40 critical-risk penalty is negative, clamped to 0.
    expect(evaluation.overallScore).toBe('0.00');
    expect(evaluation.passed).toBe(false);
  });

  it('a mission failed on the back of that rejection cannot be re-completed or re-failed', async () => {
    const system = createLateen();

    const mission = await system.ceo.submitMission({
      organizationId: ORG,
      title: 'Approve high-risk budget reallocation',
      description: 'Reallocate budget with insufficient supporting evidence.',
      priority: 'critical',
    });
    await system.ceo.dispatchMission(ORG, mission.id);

    const failed = await system.ceo.reportResult(ORG, {
      missionId: mission.id,
      success: false,
      message: 'Decision Engine evaluation failed: insufficient recommendation strength for critical risk',
    });
    expect(failed.status).toBe('failed');
    expect(failed.failureReason).toContain('Decision Engine evaluation failed');

    // The mission is terminal — neither a late success nor another failure report is a valid transition.
    await expect(
      system.ceo.reportResult(ORG, { missionId: mission.id, success: true, message: 'late success' }),
    ).rejects.toThrow();
    await expect(
      system.ceo.reportResult(ORG, { missionId: mission.id, success: false, message: 'late failure' }),
    ).rejects.toThrow();

    const final = await system.ceo.getMission(ORG, mission.id);
    expect(final?.status).toBe('failed');
  });
});
