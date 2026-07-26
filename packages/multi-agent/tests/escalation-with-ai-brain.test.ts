import { describe, expect, it } from 'vitest';
import { createBrainSystem } from '@lateen-os/ai-brain';
import { createMultiAgentRuntime } from '../src/runtime.js';

const ORG = 'org-1';
const MISSION = 'mission-1';

describe('Integration: Escalation service + real AI Brain', () => {
  it('auto-resolves a ceo_ai escalation when Brain is confident about the reasoning', async () => {
    const { brain } = createBrainSystem();
    const runtime = createMultiAgentRuntime({ brain });

    const request = await runtime.escalation.raise(
      ORG,
      MISSION,
      'Create a new pricing plan for the enterprise segment',
      'team_lead',
      'ceo_ai',
      'ceo-worker',
    );

    expect(request.status).toBe('resolved');
    expect(request.decision?.level).toBe('ceo_ai');
    expect(request.decision?.resolution.length).toBeGreaterThan(0);
  });

  it('leaves a ceo_ai escalation open when Brain cannot confidently classify the input', async () => {
    const { brain } = createBrainSystem();
    const runtime = createMultiAgentRuntime({ brain });

    const request = await runtime.escalation.raise(ORG, MISSION, 'purple elephants dance quietly', 'team_lead', 'ceo_ai', 'ceo-worker');

    expect(request.status).toBe('acknowledged');
    expect(request.decision).toBeUndefined();
  });

  it('does not consult Brain for a non-ceo_ai escalation target, even when Brain is injected', async () => {
    const { brain } = createBrainSystem();
    const runtime = createMultiAgentRuntime({ brain });

    const request = await runtime.escalation.raise(ORG, MISSION, 'Need human sign-off', 'team_lead', 'human_operator', 'ceo-worker');
    expect(request.status).toBe('open');
  });

  it('behaves identically (stays open) with no Brain injected at all', async () => {
    const runtime = createMultiAgentRuntime();
    const request = await runtime.escalation.raise(ORG, MISSION, 'Any reason', 'team_lead', 'ceo_ai', 'ceo-worker');
    expect(request.status).toBe('open');
  });

  it('resolve() manually resolves an open escalation', async () => {
    const runtime = createMultiAgentRuntime();
    const request = await runtime.escalation.raise(ORG, MISSION, 'Needs a human', 'team_lead', 'human_operator', 'ceo-worker');
    const resolved = await runtime.escalation.resolve(ORG, request.id, 'human_operator', 'Approved manually', 'human-1');
    expect(resolved.status).toBe('resolved');
    expect(resolved.decision?.resolverWorkerId).toBe('human-1');
  });
});
