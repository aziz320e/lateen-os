import { describe, expect, it } from 'vitest';
import { createBrainSystem } from '../src/brain.impl.js';
import { DecisionExplanationNotFoundError, MissionExplanationNotFoundError, PlanNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function makeRequest(rawInput: string, sessionId = 'session-1') {
  return { organizationId: ORG, sessionId, correlationId: 'corr-1', rawInput };
}

describe('createBrainQueries (via createBrainSystem)', () => {
  it('explainPlan returns the recorded plan, its node labels, and a rationale', async () => {
    const { brain, queries } = createBrainSystem();
    const response = await brain.process(makeRequest('Create a product'));

    const result = await queries.explainPlan({ organizationId: ORG, planId: response.plan.id });
    expect(result.plan.id).toBe(response.plan.id);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.rationale).toBeTruthy();
  });

  it('explainPlan throws PlanNotFoundError for an unknown plan id', async () => {
    const { queries } = createBrainSystem();
    await expect(queries.explainPlan({ organizationId: ORG, planId: 'missing' })).rejects.toBeInstanceOf(PlanNotFoundError);
  });

  it('explainDecision throws DecisionExplanationNotFoundError when no session references the decision', async () => {
    const { brain, queries } = createBrainSystem();
    await brain.process(makeRequest('Create a product'));

    await expect(
      queries.explainDecision({ organizationId: ORG, decisionId: 'decision-999' }),
    ).rejects.toBeInstanceOf(DecisionExplanationNotFoundError);
  });

  it('explainMission throws MissionExplanationNotFoundError when no session references the mission', async () => {
    const { brain, queries } = createBrainSystem();
    await brain.process(makeRequest('Start a mission to expand'));

    await expect(queries.explainMission({ organizationId: ORG, missionId: 'mission-999' })).rejects.toBeInstanceOf(
      MissionExplanationNotFoundError,
    );
  });

  it('findRelevantKnowledge matches recorded plan summaries by substring', async () => {
    const { brain, queries } = createBrainSystem();
    await brain.process(makeRequest('Create a Winter Banner product'));

    const result = await queries.findRelevantKnowledge({ organizationId: ORG, query: 'Winter Banner' });
    expect(result.totalFound).toBeGreaterThan(0);
    expect(result.entries[0]?.sourceType).toBe('execution_plan');
  });

  it('findRelevantKnowledge returns no matches for an unrelated query', async () => {
    const { brain, queries } = createBrainSystem();
    await brain.process(makeRequest('Create a Winter Banner product'));

    const result = await queries.findRelevantKnowledge({ organizationId: ORG, query: 'zzz-nonexistent-zzz' });
    expect(result.totalFound).toBe(0);
    expect(result.entries).toEqual([]);
  });
});
