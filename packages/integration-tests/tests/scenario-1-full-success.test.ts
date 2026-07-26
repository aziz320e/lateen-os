/**
 * Scenario 1 — the full happy path across every engine, composed only
 * through `createLateen()`:
 *
 *   createLateen()
 *     -> CEO submits + dispatches a mission
 *     -> Brain generates an execution plan (its router genuinely calls the
 *        same Runtime agent registry the mission's agent was registered
 *        against, and its context assembler genuinely calls Decision
 *        Engine's query layer)
 *     -> Decision Engine reasons over a proposal for the same objective
 *     -> Intelligence Engine scores the underlying opportunity
 *     -> the mission completes successfully
 *
 * CEO and Brain are independent, sibling orchestration entry points in
 * this architecture (neither calls the other) — this test verifies they
 * can be composed and used together within one `LateenSystem`, not that
 * one automatically triggers the other.
 */
import { describe, expect, it } from 'vitest';
import { createLateen } from '@lateen-os/sdk';
import { buildDecision, buildDecisionContext, buildRecommendation } from './fixtures.js';

const ORG = 'org-scenario-1';

describe('Scenario 1: full success pipeline', () => {
  it('runs createLateen -> CEO mission -> Brain plan -> Decision reasoning -> Intelligence scoring -> mission completion', async () => {
    const system = createLateen();

    // A real runtime agent is registered so Brain's routing has a real target.
    await system.runtime.agentRegistry.register(ORG, {
      runtimeAgentId: 'runtime-agent-1',
      businessDnaAgentId: 'bdna-agent-1',
      profile: { displayName: 'Ops Agent', workforceType: 'operations_ai', proactiveEnabled: true, reactiveEnabled: true },
      registeredAt: '2026-01-01T00:00:00.000Z',
    });

    // CEO submits and dispatches a mission.
    const mission = await system.ceo.submitMission({
      organizationId: ORG,
      title: 'Expand into a new market',
      description: 'Enter the packaging segment with the current product line.',
      priority: 'high',
    });
    expect(mission.status).toBe('pending');

    const tasks = await system.ceo.dispatchMission(ORG, mission.id);
    expect(tasks.length).toBeGreaterThan(0);
    const dispatched = await system.ceo.getMission(ORG, mission.id);
    expect(dispatched?.status).toBe('running');

    // Brain independently processes the same business objective. Its
    // router genuinely calls system.runtime.agentRegistry (wired at
    // createLateen() composition time) and routes to the agent above
    // instead of the generalist fallback.
    const brainResponse = await system.brain.process({
      organizationId: ORG,
      sessionId: 'session-1',
      correlationId: 'corr-1',
      rawInput: 'Expand into a new market segment',
      actorId: 'user-1',
    });
    expect(brainResponse.plan.status).toBe('ready');
    expect(brainResponse.validation.approved).toBe(true);
    expect(brainResponse.executionRequested).toBe(true);
    expect(brainResponse.plan.workerPlans[0]?.role).toBe('operations_ai');

    // Decision Engine reasons over a proposal backing the same objective.
    // Strong recommendation (0.85) against low risk (penalty 0.05) ->
    // deterministically overallScore 0.80, passed.
    const decision = buildDecision(ORG, { risk: 'low' });
    const context = buildDecisionContext(ORG, decision.id);
    const recommendation = buildRecommendation(ORG, decision.id, '0.85', '0.90');
    const evaluation = await system.decisionEngine.reasoner.reason({
      decision,
      context,
      recommendations: [recommendation],
    });
    expect(evaluation.passed).toBe(true);
    expect(evaluation.overallScore).toBe('0.80');

    // Intelligence Engine scores the underlying opportunity.
    const score = system.intelligenceEngine.scorer.score(ORG, 'opportunity', mission.id, {
      demand: { value: '0.80' },
      profit: { value: '0.70' },
      risk: { value: '0.20' },
    });
    expect(Number(score.composite)).toBeGreaterThan(0.5);

    // The mission completes successfully.
    const completed = await system.ceo.reportResult(ORG, {
      missionId: mission.id,
      success: true,
      message: 'Expansion plan delivered',
    });
    expect(completed.status).toBe('completed');

    const final = await system.ceo.getMission(ORG, mission.id);
    expect(final?.status).toBe('completed');
  });
});
