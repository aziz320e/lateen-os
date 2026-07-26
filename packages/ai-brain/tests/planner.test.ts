import { describe, expect, it } from 'vitest';
import { createEnterpriseContextAssembler } from '../src/context/assembler.impl.js';
import { createIntentRecognizer } from '../src/intent/recognizer.impl.js';
import { createWorkingMemory } from '../src/memory/working-memory.impl.js';
import { createBrainPlanner } from '../src/planner/planner.impl.js';
import { createEnterpriseReasoner } from '../src/reasoning/reasoner.impl.js';
import { createPlatformRouter } from '../src/routing/router.impl.js';

const ORG = 'org-1';
const SESSION = 'session-1';
const CORRELATION = 'corr-1';

async function planFor(rawInput: string) {
  const intent = await createIntentRecognizer().recognize({ organizationId: ORG, sessionId: SESSION, rawInput });
  const context = await createEnterpriseContextAssembler().assemble({
    organizationId: ORG,
    sessionId: SESSION,
    correlationId: CORRELATION,
    intent,
  });
  const reasoning = await createEnterpriseReasoner({ workingMemory: createWorkingMemory() }).reason({
    organizationId: ORG,
    sessionId: 'reasoning-1',
    intent,
    context,
  });
  const routing = await createPlatformRouter().route({ organizationId: ORG, reasoningResult: reasoning });
  const plan = await createBrainPlanner().createPlan({
    organizationId: ORG,
    reasoningSessionId: 'reasoning-1',
    intent,
    context,
    routing,
  });
  return { intent, routing, plan };
}

describe('createBrainPlanner', () => {
  it('always includes a worker plan and a leading validation node', async () => {
    const { routing, plan } = await planFor('Create a product listing');

    expect(plan.workerPlans).toHaveLength(routing.workerRoutes.length);
    expect(plan.graph.nodes[0]?.kind).toBe('validation');
    expect(plan.graph.nodes[0]?.order).toBe(0);
    expect(plan.status).toBe('pending_validation');
  });

  it('builds a mission plan with priority derived from intent confidence', async () => {
    const { intent, plan } = await planFor('Start a mission to expand into a new market');
    expect(plan.missionPlan).toBeDefined();
    expect(plan.missionPlan?.objective).toBe(intent.summary);
    expect(['critical', 'high', 'medium', 'low']).toContain(plan.missionPlan?.priority);
  });

  it('produces one execution node per routed target plus the validation node', async () => {
    const { routing, plan } = await planFor('Decide whether to approve this budget');
    const expectedNodeCount =
      1 + routing.serviceRoutes.length + routing.workflowRoutes.length + routing.missionRoutes.length + routing.workerRoutes.length;
    expect(plan.graph.nodes).toHaveLength(expectedNodeCount);
  });

  it('chains nodes with sequential edges', async () => {
    const { plan } = await planFor('Update the onboarding workflow');
    expect(plan.graph.edges).toHaveLength(plan.graph.nodes.length - 1);
    expect(plan.graph.edges.every((edge) => edge.kind === 'sequential')).toBe(true);
  });

  it('adds exactly one checkpoint gating the validation node', async () => {
    const { plan } = await planFor('Create a product');
    expect(plan.graph.checkpoints).toHaveLength(1);
    expect(plan.graph.checkpoints[0]?.nodeId).toBe(plan.graph.nodes[0]?.id);
  });
});
