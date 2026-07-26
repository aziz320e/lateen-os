import { describe, expect, it } from 'vitest';
import { createEnterpriseContextAssembler } from '../src/context/assembler.impl.js';
import { createIntentRecognizer } from '../src/intent/recognizer.impl.js';
import { createWorkingMemory } from '../src/memory/working-memory.impl.js';
import { createBrainPlanner } from '../src/planner/planner.impl.js';
import { createEnterpriseReasoner } from '../src/reasoning/reasoner.impl.js';
import { createPlatformRouter } from '../src/routing/router.impl.js';
import { createPlanValidator } from '../src/validation/validator.impl.js';

const ORG = 'org-1';
const SESSION = 'session-1';
const CORRELATION = 'corr-1';

async function buildPlanAndContext(rawInput: string) {
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
  return { plan, context };
}

describe('createPlanValidator', () => {
  it('approves a well-formed plan with an actor present', async () => {
    const { plan, context } = await buildPlanAndContext('Create a product');
    const validator = createPlanValidator();

    const result = await validator.validate({ organizationId: ORG, plan, context, actorId: 'user-1' });
    expect(result.approved).toBe(true);
    expect(result.permission.status).toBe('passed');
  });

  it('warns, but does not reject, when no actor is provided', async () => {
    const { plan, context } = await buildPlanAndContext('Create a product');
    const validator = createPlanValidator();

    const result = await validator.validate({ organizationId: ORG, plan, context });
    expect(result.permission.status).toBe('warning');
    expect(result.approved).toBe(true);
  });

  it('fails policy validation when the plan summary is blank', async () => {
    const { plan, context } = await buildPlanAndContext('Create a product');
    const validator = createPlanValidator();

    const result = await validator.validate({ organizationId: ORG, plan: { ...plan, summary: '  ' }, context, actorId: 'user-1' });
    expect(result.policy.status).toBe('failed');
    expect(result.approved).toBe(false);
  });

  it('fails business validation when the execution graph has no nodes', async () => {
    const { plan, context } = await buildPlanAndContext('Create a product');
    const brokenPlan = { ...plan, graph: { ...plan.graph, nodes: [] } };
    const validator = createPlanValidator();

    const result = await validator.validate({ organizationId: ORG, plan: brokenPlan, context, actorId: 'user-1' });
    expect(result.business.status).toBe('failed');
    expect(result.business.violations).toContain('Execution graph has no nodes.');
    expect(result.approved).toBe(false);
  });

  it('warns when the plan falls back to a generalist worker', async () => {
    const { plan, context } = await buildPlanAndContext('Create a product');
    const validator = createPlanValidator();

    const result = await validator.validate({ organizationId: ORG, plan, context, actorId: 'user-1' });
    expect(result.business.warnings).toContain(
      'Plan falls back to a generalist worker — no specialized runtime agent was available.',
    );
  });
});
