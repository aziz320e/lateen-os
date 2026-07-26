/**
 * Scenario 3 — unrecognizable input. Brain and CEO run independent,
 * differently-implemented classifiers (Brain's IntentRecognizer has an
 * explicit "unknown" type; CEO's Planner is keyword-based and always
 * falls back to a default agent, with no "unknown" concept at all). This
 * scenario verifies both real behaviors rather than assuming they agree.
 */
import { describe, expect, it } from 'vitest';
import { createLateen } from '@lateen-os/sdk';

const ORG = 'org-scenario-3';
const GIBBERISH = 'purple elephants dance quietly';

describe('Scenario 3: unknown intent', () => {
  it("Brain classifies unrecognizable input as 'unknown', fails reasoning, but still degrades to a usable plan", async () => {
    const system = createLateen();

    const response = await system.brain.process({
      organizationId: ORG,
      sessionId: 'session-1',
      correlationId: 'corr-1',
      rawInput: GIBBERISH,
      actorId: 'user-1',
    });

    expect(response.intent.type).toBe('unknown');
    expect(response.reasoning.success).toBe(false);
    expect(response.reflection.shouldRevise).toBe(true);
    expect(response.reflection.evaluation.gaps).toContain('Intent could not be confidently classified.');

    // Graceful degradation: no crash, and routing still falls back to a generalist worker.
    expect(response.plan.workerPlans[0]?.role).toBe('generalist');
    expect(response.validation.approved).toBe(true);
  });

  it("CEO's planner has no 'unknown' concept — the same gibberish still routes to its default agent", async () => {
    const system = createLateen();

    const mission = await system.ceo.submitMission({
      organizationId: ORG,
      title: GIBBERISH,
      description: GIBBERISH,
      priority: 'low',
    });
    const tasks = await system.ceo.dispatchMission(ORG, mission.id);

    expect(tasks[0]?.agent).toBe('operations');
    const dispatched = await system.ceo.getMission(ORG, mission.id);
    expect(dispatched?.status).toBe('running');
    expect(dispatched?.assignedTo).toBe('operations');
  });
});
